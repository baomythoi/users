import { Channel } from 'amqplib';
import BaseCommon from '@core/base.common';

/** Worker RPC */
import UsersWorker from '@services/rabbitmq/worker/user.amqp';

//interface
import { RequestParams } from '@interfaces/rabbitmq';

const WORKER_EXCHANGE = 'worker.service.users.exchange';
const WORKER_QUEUE = 'worker.service.users.queue';
const WORKER_DLX_EXCHANGE = 'worker.service.users.dlx.exchange';
const WORKER_DLQ = 'worker.service.users.dlq';
const MAX_RETRIES = 3;
const WORKER_HANDLERS = [
  UsersWorker,
];

export default class WorkerConsumer {
  protected channelWrapper!: Channel;
  // worker
  protected workerExchange = WORKER_EXCHANGE;
  protected workerQueue = WORKER_QUEUE;

  initConsumer = async (channel: Channel): Promise<void> => {
    this.channelWrapper = channel;

    await this.channelWrapper.assertExchange(this.workerExchange, 'topic', {
      durable: true,
    });

    /** Dead Letter Exchange & Queue for failed messages */
    await this.channelWrapper.assertExchange(WORKER_DLX_EXCHANGE, 'fanout', {
      durable: true,
    });
    await this.channelWrapper.assertQueue(WORKER_DLQ, {
      durable: true,
      autoDelete: false,
    });
    await this.channelWrapper.bindQueue(WORKER_DLQ, WORKER_DLX_EXCHANGE, '');

    /** Queue */
    await this.channelWrapper.assertQueue(this.workerQueue, {
      durable: true,
      autoDelete: false,
      arguments: {
        'x-queue-type': 'quorum',
        'x-message-ttl': 300_000,
        'x-dead-letter-exchange': WORKER_DLX_EXCHANGE,
      },
    });

    /** Routing */
    await Promise.allSettled(WORKER_HANDLERS.map(async (handler) => {
      await this.channelWrapper.bindQueue(
        this.workerQueue,
        this.workerExchange,
        handler.routing
      );
    }))

    this.startConsumer();
  }

  async startConsumer(): Promise<void> {
    this.channelWrapper.consume(this.workerQueue, async (message) => {
      if (!message) return;

      const routingKey = message.fields.routingKey;
      const { correlationId } = message.properties;

      /** Parse message safely */
      let request: RequestParams;
      try {
        request = JSON.parse(message.content.toString());
      } catch {
        BaseCommon.logger.error(`Malformed worker message, discarding. routingKey: ${routingKey}`);
        return this.channelWrapper.ack(message);
      }

      /** get handler process message */
      const handler = WORKER_HANDLERS.find((_handler) => {
        return BaseCommon.topicMatch(_handler.routing, routingKey);
      })
      if (!handler)
        return this.channelWrapper.ack(message);

      try {
        await handler.processMessage(routingKey, request);
        this.channelWrapper.ack(message);
      } catch (error: any) {
        /** Retry logic: requeue if under max retries, otherwise ack (goes to DLQ via nack) */
        const retryCount = (message.properties.headers?.['x-retry-count'] || 0) as number;

        if (retryCount < MAX_RETRIES) {
          // Requeue with incremented retry count
          this.channelWrapper.publish(
            this.workerExchange,
            routingKey,
            message.content,
            {
              correlationId,
              headers: { 'x-retry-count': retryCount + 1 },
              persistent: true,
            }
          );
          this.channelWrapper.ack(message);

          BaseCommon.logger.warn(
            `Worker retry ${retryCount + 1}/${MAX_RETRIES} for ${routingKey}: ${error?.message}`
          );
        } else {
          // Max retries exceeded → nack to DLQ
          this.channelWrapper.nack(message, false, false);

          BaseCommon.logger.error(
            `Worker max retries exceeded for ${routingKey}, sent to DLQ: ${error?.message}`
          );
        }
      }
    });
  }
}