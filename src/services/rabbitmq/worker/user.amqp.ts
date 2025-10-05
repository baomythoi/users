import BaseCommon from '@core/base.common';
import { Channel } from 'amqplib';

// service

// interface
import { RequestParams } from '@interfaces/rabbitmq';

export default class UserWorker {
  protected channelWrapper: Channel;
  protected common;
  private NUM_CONSUMERS = 5; // Number of parallel consumers per queue
  private MAX_RETRIES = 3; // Retry limit

  protected routing = 'worker.users.*.routing';
  protected dlRouting = 'worker.users.dl_routing';

  protected queue = 'worker.users.queue';
  protected dlQueue = 'worker.users.dl_queue';

  constructor(channel: Channel) {
    this.channelWrapper = channel;
    this.common = BaseCommon;
  }

  async init(exchange: string, dlExchange: string): Promise<void> {
    /** DL Queue */
    await this.channelWrapper.assertQueue(this.dlQueue, {
      durable: true,
      arguments: {
        'x-expires': 300_000, // Auto-delete queue after 5 minutes of inactivity
      }
    });
    await this.channelWrapper.bindQueue(this.dlQueue, dlExchange, this.dlRouting);

    /** Queue */
    await this.channelWrapper.assertQueue(this.queue, {
      durable: true,
      autoDelete: false,
      arguments: {
        'x-queue-type': 'quorum',
        'x-dead-letter-exchange': dlExchange, // Send failed messages to DLX
        'x-dead-letter-routing-key': this.dlRouting, // Route to correct DLQ
        'x-message-ttl': 60_000, // Optional: keep message in queue 60s before send to dlq
        'x-expires': 300_000, // Auto-delete queue after 5 minutes of inactivity
      },
    });
    await this.channelWrapper.bindQueue(this.queue, exchange, this.routing);

    /** start consumer */
    for (let i = 0; i < this.NUM_CONSUMERS; i++) {
      this.startConsumer();
    }

    /** start dead letter proccess */
    this.startDLQHandle(exchange);
  }

  async startConsumer(): Promise<void> {
    this.channelWrapper.consume(this.queue, async (message) => {
      if (!message) return;

      const routingKey = message.fields.routingKey;
      const request = JSON.parse(message.content.toString());

      this.common.logger.info(`${this.common.moment.init().format('YYYY-MM-DD HH:mm:ss')} | ${routingKey}-request: ${JSON.stringify(request)}`);

      try {
        this.processMessage(routingKey, request);
        this.channelWrapper.ack(message);
      } catch (error: any) {
        let retries = 1;
        if (message.properties.headers)
          retries = (message.properties.headers['x-retry-count'] || 1);

        if (retries <= this.MAX_RETRIES) {
          // Moves message to DLX → DLQ
          this.channelWrapper.sendToQueue(this.dlQueue, Buffer.from(message.content), {
            headers: {
              'x-retry-count': retries + 1,
              'x-retry-routing-key': routingKey
            }
          });
        } else {
          this.channelWrapper.ack(message);

          // day notify thong bao loi
        }

        this.common.logger.error(`${this.common.moment.init().format('YYYY-MM-DD HH:mm:ss')} | ${routingKey}-message: ${error?.message}`);
        this.common.logger.error(`${this.common.moment.init().format('YYYY-MM-DD HH:mm:ss')} | ${routingKey}-stack: ${error?.stack}`);
      }
    });
  }

  // DLQ Handling: Reprocess messages
  async startDLQHandle(exchange: string): Promise<void> {
    this.channelWrapper.consume(this.dlQueue, async (message) => {
      if (!message) return;

      const retries = message.properties.headers['x-retry-count'];
      const routingKey = message.properties.headers['x-retry-routing-key'];

      // Republish to main queue
      this.channelWrapper.publish(exchange, routingKey, message.content, {
        persistent: true,
        headers: { 'x-retry-count': retries },
        correlationId: message.properties.correlationId,
      });

      this.channelWrapper.ack(message);
      this.common.logger.info(`🔁 Moved message from ${this.dlQueue} back to ${this.queue} (Retry: ${retries})`);
    });
  }

  processMessage(routingKey: string, request: RequestParams): void {
    switch (routingKey) {
      case 'worker.users.create_collaborator_contract.routing':
        // CollaboratorService.createContract(request.params);
        break;
    }
  }
}