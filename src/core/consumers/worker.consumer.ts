import { Channel } from 'amqplib';
import BaseCommon from '@core/base.common';

/** Worker RPC */
import UsersWorker from '@services/rabbitmq/worker/user.amqp';

//interface
import { RequestParams } from '@interfaces/rabbitmq';

const WORKER_EXCHANGE = 'worker.service.users.exchange';
const WORKER_QUEUE = 'worker.service.users.queue';
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

    /** Queue */
    await this.channelWrapper.assertQueue(this.workerQueue, {
      durable: true,
      autoDelete: false,
      arguments: {
        'x-queue-type': 'quorum',
        'x-message-ttl': 60_000, // Optional: keep message in queue 60s before send to dlq
        'x-expires': 300_000, // Auto-delete queue after 5 minutes of inactivity
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
      const request: RequestParams = JSON.parse(message.content.toString());
      const { correlationId } = message.properties;
      let result;

      /** get handler process message */
      const handler = WORKER_HANDLERS.find((_handler) => {
        return BaseCommon.topicMatch(_handler.routing, routingKey);
      })
      if (!handler)
        return this.channelWrapper.ack(message);

      try {
        result = await handler.processMessage(routingKey, request);
        this.channelWrapper.ack(message);
      } catch (error: any) {
        this.channelWrapper.ack(message);

        result = {
          success: false,
          message: error?.message,
          stack: error?.stack
        }
      }

      /** mq logger */
      BaseCommon.mqLogger({
        service: 'chatbot',
        correlationId,
        queue: this.workerQueue,
        routingKey,
        request: request.params,
        response: result,
        status: result.success ? 'success' : 'fail'
      })
    });
  }
}