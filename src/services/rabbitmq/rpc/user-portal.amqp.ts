import BaseCommon from '@core/base.common';
import { Channel } from 'amqplib';

// interface
import { FuncResponse } from '@interfaces/response';
import { RequestParams } from '@interfaces/rabbitmq';

// schema
import {
  ProfileSchema,
  EditUserPortalProfileSchema,
  ChangePasswordSchema,
  GetAffUserByRoleSchema,
} from '@schemas/user/profile';

// service
import UserPortalProfile from '@services/user-portal/profile.service';

export default class UserPortalAmqp {
  protected channelWrapper: Channel;
  protected common;
  protected NUM_CONSUMERS = 5; // Number of parallel consumers per queue
  private MAX_RETRIES = 3; // Retry limit

  protected routing = 'rpc.users_portal.#.routing';
  protected dlRouting = 'rpc.users_portal.dl_routing';

  protected queue = 'rpc.users_portal.queue';
  protected dlQueue = 'rpc.users_portal.dl_queue';

  constructor(channel: Channel) {
    this.channelWrapper = channel;
    this.common = BaseCommon;
  }

  async init(exchange: string, dlExchange: string): Promise<void> {
    /** DL Queue */
    await this.channelWrapper.deleteQueue(this.dlQueue);
    await this.channelWrapper.assertQueue(this.dlQueue, {
      durable: true,
      arguments: {
        'x-expires': 300_000, // Auto-delete queue after 5 minutes of inactivity
      }
    });
    await this.channelWrapper.bindQueue(this.dlQueue, dlExchange, this.dlRouting);

    /** Queue */
    await this.channelWrapper.deleteQueue(this.queue);
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
    this.startDLQHandle();
  }

  async startConsumer(): Promise<void> {
    this.channelWrapper.consume(this.queue, async (message) => {
      if (!message) return;

      const routingKey = message.fields.routingKey;
      const request = JSON.parse(message.content.toString());
      const { correlationId, replyTo } = message.properties;

      this.common.logger.info(`${this.common.moment.init().format('YYYY-MM-DD HH:mm:ss')} | ${routingKey}-request: ${JSON.stringify(request)}`);

      try {
        const result = await this.proccessMessage(routingKey, request);
        this.channelWrapper.sendToQueue(replyTo, Buffer.from(JSON.stringify(result)), { correlationId });
        this.channelWrapper.ack(message);

        this.common.logger.info(`${this.common.moment.init().format('YYYY-MM-DD HH:mm:ss')} | ${routingKey}-response: ${JSON.stringify(result)}`);
      } catch (error: any) {
        let retries = 1;
        if (message.properties.headers)
          retries = (message.properties.headers['x-retry-count'] || 1);

        if (retries < this.MAX_RETRIES) {
          // Moves message to DLX → DLQ
          this.channelWrapper.reject(message, false);
        } else {
          this.channelWrapper.sendToQueue(replyTo, Buffer.from(JSON.stringify({
            statusCode: 500,
            code: 'users_portal_exception',
            success: false,
            message: error?.message || 'Unknown error occurred',
            error
          })), { correlationId });

          this.channelWrapper.ack(message);

          // day notify thong bao loi
        }

        this.common.logger.error(`${this.common.moment.init().format('YYYY-MM-DD HH:mm:ss')} | ${routingKey}-message: ${error?.message}`);
        this.common.logger.error(`${this.common.moment.init().format('YYYY-MM-DD HH:mm:ss')} | ${routingKey}-stack: ${error?.stack}`);
      }
    });
  }

  // DLQ Handling: Reprocess messages
  async startDLQHandle(): Promise<void> {
    this.channelWrapper.consume(this.dlQueue, async (message) => {
      if (!message) return;

      let retries = 1;
      if (message.properties.headers)
        retries = (message.properties.headers['x-retry-count'] || 0) + 1;

      if (retries < this.MAX_RETRIES) {
        // Republish to main queue with updated retry count
        this.channelWrapper.sendToQueue(this.queue, message.content, {
          persistent: true,
          headers: { 'x-retry-count': retries },
          correlationId: message.properties.correlationId,
          replyTo: message.properties.replyTo,
        });

        this.channelWrapper.ack(message);
        this.common.logger.info(`🔁 Moved message from ${this.dlQueue} back to ${this.queue} (Retry: ${retries})`);
      } else {
        this.channelWrapper.sendToQueue(message.properties.replyTo, Buffer.from(JSON.stringify({
          statusCode: 503,
          code: 'users_portal_max_retries',
          success: false,
          message: 'Unknown error occurred',
        })), { correlationId: message.properties.correlationId });

        this.channelWrapper.ack(message);

        // day notify thong bao loi
      }
    });
  }

  async proccessMessage(routingKey: string, request: RequestParams): Promise<FuncResponse<object>> {
    let isValid: FuncResponse<object>;

    switch (routingKey) {
      case 'rpc.users_portal.profile.routing':
        isValid = await this.common.validate.compile(request.params, ProfileSchema);
        if (!isValid.success)
          return isValid;

        return await UserPortalProfile.getByUsername(request.params);

      case 'rpc.users_portal.edit_profile.routing':
        isValid = await this.common.validate.compile(request.params, EditUserPortalProfileSchema);
        if (!isValid.success)
          return isValid;

        return await UserPortalProfile.edit(request.params, request.authentication);

      case 'rpc.users_portal.change_password.routing':
        isValid = await this.common.validate.compile(request.params, ChangePasswordSchema);
        if (!isValid.success)
          return isValid;

        return await UserPortalProfile.changePassword(request.params, request.authentication);

      case 'rpc.users_portal.get_aff_user_by_role.routing':
        isValid = await this.common.validate.compile(request.params, GetAffUserByRoleSchema);
        if (!isValid.success)
          return isValid;

        return await UserPortalProfile.getAffUserByRole(request.params);

      default:
        return {
          statusCode: 404,
          success: false,
          message: `${routingKey} could not be found.`
        }
    }
  }
}