import { Channel } from 'amqplib';
import BaseCommon from '@core/base.common';

/** Users RPC */
import UserRPC from '@services/rabbitmq/rpc/user.amqp';
import StatisticRPC from '@services/rabbitmq/rpc/statistics.amqp';

//interface
import { RequestParams } from '@interfaces/rabbitmq';

// rpc
const RPC_EXCHANGE = 'rpc.service.users.exchange';
const RPC_QUEUE = 'rpc.service.users.queue';
const RPC_HANDLERS = [
  UserRPC,
  StatisticRPC,
];
 
export default class RPCConsumer {
  protected channelWrapper!: Channel;
  // rpc
  protected exchange = RPC_EXCHANGE;
  protected queue = RPC_QUEUE;

  initConsumer = async (channel: Channel): Promise<void> => {
    this.channelWrapper = channel;

    await this.channelWrapper.assertExchange(this.exchange, 'topic', {
      durable: true,
    });

    /** Queue */
    await this.channelWrapper.assertQueue(this.queue, {
      durable: true,
      autoDelete: false,
      arguments: {
        'x-queue-type': 'quorum',
        'x-message-ttl': 60_000, // Optional: keep message in queue 60s before send to dlq
        'x-expires': 300_000, // Auto-delete queue after 5 minutes of inactivity
      },
    });

    /** Routing */
    await Promise.allSettled(RPC_HANDLERS.map(async (handler) => {
      await this.channelWrapper.bindQueue(
        this.queue,
        this.exchange,
        handler.routing
      );
    }));

    this.startConsumer();
  }

  startConsumer = async () => {
    this.channelWrapper.consume(this.queue, async (message) => {
      if (!message) return;

      const routingKey = message.fields.routingKey;
      const request: RequestParams = JSON.parse(message.content.toString());
      const { correlationId, replyTo } = message.properties;
      let result;

      /** get handler process message */
      const handler = RPC_HANDLERS.find((_handler) => {
        return BaseCommon.topicMatch(_handler.routing, routingKey);
      })
      if (!handler)
        return this.channelWrapper.ack(message);

      try {
        result = await handler.processMessage(routingKey, request);
        result.correlationId = correlationId;
        this.channelWrapper.sendToQueue(replyTo, Buffer.from(JSON.stringify(result)), { correlationId });
        this.channelWrapper.ack(message);
      } catch (error: any) {
        this.channelWrapper.sendToQueue(replyTo, Buffer.from(JSON.stringify({
          statusCode: error?.code || 500,
          code: 'users_exception',
          success: false,
          message: error?.message || 'Unknown error occurred',
          error
        })), { correlationId });

        this.channelWrapper.ack(message);

        result = {
          success: false,
          statusCode: 500,
          data: {
            message: error?.message,
            stack: error?.stack
          }
        }
      }

      /** mq logger */
      BaseCommon.mqLogger({
        service: 'users_rpc_consumer',
        correlationId,
        queue: this.queue,
        routingKey,
        request: request.params,
        response: result,
        status: result?.success ? 'success' : 'fail'
      })
    });
  }
}