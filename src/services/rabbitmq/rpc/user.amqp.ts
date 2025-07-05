import BaseCommon from '@core/base.common';
import { Channel } from 'amqplib';

// interface
import { FuncResponse } from '@interfaces/response';
import { RequestParams } from '@interfaces/rabbitmq';

// schema
import {
  ProfileSchema,
  EditUserProfileSchema,
  RegGSaleAccountSchema
} from '@schemas/user/profile';
import {
  FindAllSchema,
  ActiveSchema
} from '@schemas/user/collaborator';
import { BH365CreateUserSchema } from '@schemas/user/bh365';
import {
  GetProvincesSchema,
  GetDistrictsSchema
} from '@schemas/user/address.schema';

// service
import UserProfile from '@services/user/profile.service';
import CollaboratorService from '@services/user/collaborator.service';
import UserBH365 from '@services/user/bh365.service';
import AddressService from '@services/user/address.service';

export default class UserPortalAmqp {
  protected channelWrapper: Channel;
  protected common;
  protected NUM_CONSUMERS = 5; // Number of parallel consumers per queue
  private MAX_RETRIES = 3; // Retry limit

  protected routing = 'rpc.users.*.routing';
  protected dlRouting = 'rpc.users.dl_routing';

  protected queue = 'rpc.users.queue';
  protected dlQueue = 'rpc.users.dl_queue';

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
      this.startConsumer(this.queue);
    }

    /** start dead letter proccess */
    this.startDLQHandle(exchange);
  }

  async startConsumer(queue: string): Promise<void> {
    this.channelWrapper.consume(queue, async (message) => {
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
            code: 'users_exception',
            success: false,
            message: error?.message || 'Unknown error occurred',
            error
          })), { correlationId });

          this.channelWrapper.ack(message);

          // todo day notify thong bao loi
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

      let retries = 1;
      if (message.properties.headers)
        retries = (message.properties.headers['x-retry-count'] || 0) + 1;

      if (retries < this.MAX_RETRIES) {
        // Republish to main queue with updated retry count
        this.channelWrapper.publish(
          exchange,
          message.fields.routingKey,
          message.content,
          {
            persistent: true,
            headers: { 'x-retry-count': retries },
            correlationId: message.properties.correlationId,
            replyTo: message.properties.replyTo,
          }
        )

        this.channelWrapper.ack(message);
        this.common.logger.info(`🔁 Moved message from ${this.dlQueue} back to ${this.queue} (Retry: ${retries})`);
      } else {
        this.channelWrapper.sendToQueue(message.properties.replyTo, Buffer.from(JSON.stringify({
          statusCode: 503,
          code: 'users_max_retries',
          success: false,
          message: 'Unknown error occurred',
        })), { correlationId: message.properties.correlationId });

        this.channelWrapper.ack(message);

        // todo day notify thong bao loi
      }
    });
  }

  async proccessMessage(routingKey: string, request: RequestParams): Promise<FuncResponse<object>> {
    let isValid: FuncResponse<object>;

    switch (routingKey) {
      case 'rpc.users.profile.routing':
        isValid = await this.common.validate.compile(request.params, ProfileSchema);
        if (!isValid.success)
          return isValid;

        return await UserProfile.get(request.params);

      case 'rpc.users.edit_profile.routing':
        isValid = await this.common.validate.compile(request.params, EditUserProfileSchema);
        if (!isValid.success)
          return isValid;

        return await UserProfile.edit(request.params, request.authentication);

      case 'rpc.users.get_direct_collaborators.routing':
        isValid = await this.common.validate.compile(request.params, FindAllSchema);
        if (!isValid.success)
          return isValid;

        return await CollaboratorService.getAllDirect(request.params);

      case 'rpc.users.get_under_collaborators.routing':
        isValid = await this.common.validate.compile(request.params, FindAllSchema);
        if (!isValid.success)
          return isValid;

        return await CollaboratorService.getAllUnder(request.params);

      case 'rpc.users.bh365_create.routing':
        isValid = await this.common.validate.compile(request.params, BH365CreateUserSchema);
        if (!isValid.success)
          return isValid;

        return await UserBH365.create(request.params);

      case 'rpc.users.get_provinces.routing':
        isValid = await this.common.validate.compile(request.params, GetProvincesSchema);
        if (!isValid.success)
          return isValid;

        return await AddressService.getProvinces(request.params);

      case 'rpc.users.get_districts.routing':
        isValid = await this.common.validate.compile(request.params, GetDistrictsSchema);
        if (!isValid.success)
          return isValid;

        return await AddressService.getDistricts(request.params);

      case 'rpc.users.register.routing':
        isValid = await this.common.validate.compile(request.params, RegGSaleAccountSchema);
        if (!isValid.success)
          return isValid;

        return await UserProfile.register(request.params);

      case 'rpc.users.gsale_active_collaborator.routing':
        isValid = await this.common.validate.compile(request.params, ActiveSchema);
        if (!isValid.success)
          return isValid;

        return await CollaboratorService.active(request.params);

      default:
        return {
          statusCode: 404,
          success: false,
          message: `${routingKey} could not be found.`
        }
    }
  }
}