import BaseCommon from '@core/base.common';
import { ErrorCodes } from '@enums/error-code';
import { CustomError } from '@errors/custom';

// interface
import { FuncResponse } from '@interfaces/response';
import { PostMessagesParams } from '@interfaces/rabbitmq';

export default class BaseService {
  protected errorCodes = ErrorCodes;
  protected common;

  constructor() {
    this.common = BaseCommon;
  }

  async postMessages(params: {
    exchange: string;
    routing: string;
    message: PostMessagesParams,
  }) {
    try {
      const channelWrapper = await this.common.rabbitmq.createChannel();
      const correlationId = `users_${this.common.nanoid.generateCorrelationId()}`;
      const replyQueue = 'amq.rabbitmq.reply-to';
      // const replyQueue = await channelWrapper.assertQueue(`users_${this.common.nanoid.generateRandomId(30)}`, {
      //   exclusive: true, // Only this connection can use the queue
      //   // exclusive: false, // Non-exclusive queue
      //   autoDelete: true, // Delete when no longer in use
      //   expires: 60_000,  // Set expiration time to 60000 ms (1 minute)
      //   arguments: { 'x-queue-mode': 'lazy' } // Store messages on disk to reduce RAM usage
      // });

      const rabbitMQResponsePromise = new Promise<FuncResponse<object>>((resolve, reject) => {
        const timeoutId = setTimeout(async () => {
          await channelWrapper.cancel(correlationId);
          await channelWrapper.close();
          reject(new Error(`${params.routing} call timed out.`));
        }, 60_000); // timeout in 1 minute

        channelWrapper.consume(replyQueue, async (msg) => {
          if (msg !== null && msg.properties.correlationId === correlationId) {
            const response: FuncResponse<object> = JSON.parse(msg.content.toString());
            clearTimeout(timeoutId);
            resolve(response);

            // Cancel the consumer & close channel after resolving the promise
            await channelWrapper.cancel(correlationId);
            await channelWrapper.close();
          }
        }, {
          noAck: true,
          consumerTag: correlationId
        });
      });

      channelWrapper.publish(
        params.exchange,
        params.routing,
        Buffer.from(JSON.stringify(params.message)), {
        correlationId: correlationId,
        replyTo: replyQueue
      });

      return rabbitMQResponsePromise;
    } catch (error: any) {
      return this.responseError(error)
    }
  }

  async pushToWorker(params: {
    exchange: string;
    routing: string;
    message: PostMessagesParams,
  }): Promise<void> {
    const channelWrapper = await this.common.rabbitmq.getChannel();

    channelWrapper.publish(
      params.exchange,
      params.routing,
      Buffer.from(JSON.stringify(params.message)), {
      persistent: true, // Make the message persistent (survive server restarts)
      mandatory: true, // Return the message as unhandled if no queues are bound
      timestamp: Date.now(), // Message timestamp
    });
  }

  protected responseSuccess(data: any = undefined): FuncResponse<any> {
    const successResult = {
      statusCode: 200,
      success: true,
      data
    }

    return successResult;
  }

  protected responseError(error: Error): FuncResponse<any> {
    let statusCode = 500;
    let code = '';
    if (error instanceof CustomError) {
      statusCode = error.statusCode;
      code = error.code;
    }

    return {
      statusCode,
      success: false,
      code,
      message: error.message,
      error
    }
  }
}