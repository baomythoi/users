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

  /**
   * RPC call — uses a shared RPC channel with correlationId-based routing
   * 
   * How it works:
   * 1. Get shared RPC channel (created once, reused for all RPC calls)
   * 2. Register a pending request with unique correlationId
   * 3. Publish message to target exchange with replyTo = amq.rabbitmq.reply-to
   * 4. Shared consumer on reply queue matches response by correlationId
   * 5. Resolve/reject the pending promise
   *
   * Benefits: No channel creation/destruction per call → better throughput & lower overhead
   */
  private static readonly RPC_TIMEOUT = 30_000;

  async postMessages(params: {
    exchange: string;
    routing: string,
    message: PostMessagesParams,
  }) {
    try {
      const rpcChannel = await BaseCommon.rabbitmq.getRpcChannel();
      const correlationId = `users_${BaseCommon.nanoid.generateCorrelationId()}`;

      // Register pending request (will resolve when response arrives or reject on timeout)
      const responsePromise = BaseCommon.rabbitmq.registerRpcRequest(
        correlationId,
        BaseService.RPC_TIMEOUT,
      );

      // Publish RPC request
      const sent = rpcChannel.publish(
        params.exchange,
        params.routing,
        Buffer.from(JSON.stringify(params.message)), {
        correlationId,
        replyTo: 'amq.rabbitmq.reply-to',
      });

      if (!sent) {
        throw new Error('RabbitMQ channel buffer full');
      }

      return await responsePromise;
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  /**
   * Fire-and-forget publish — uses a shared publisher channel
   * Used for pushing background tasks to Worker or Message consumers
   */
  async pushToWorker(params: {
    exchange: string;
    routing: string;
    message: PostMessagesParams,
  }): Promise<void> {
    const publisherChannel = await BaseCommon.rabbitmq.getPublisherChannel();

    publisherChannel.publish(
      params.exchange,
      params.routing,
      Buffer.from(JSON.stringify(params.message)), {
      persistent: true,
      timestamp: Date.now(),
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