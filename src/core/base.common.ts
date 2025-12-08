import Pino from 'pino';
import ConvertData from '@utils/convert-data';
import Validate from '@utils/validate';
import Moment from '@utils/moment';
import Rabbitmq from '@utils/rabbitmq';
import NanoId from '@utils/nanoid';
import RedisService from '@core/base.redis';
import {
  MQLoggerPrarams,
  ThirdPartyLoggerParams
} from '@interfaces/rabbitmq';

export default class BaseCommon {
  static readonly convertData = ConvertData;
  static readonly validate = Validate;
  static readonly moment = Moment;
  static readonly rabbitmq = Rabbitmq;
  static readonly nanoid = NanoId;
  static readonly redis = RedisService;
  static readonly logger = Pino({
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  });

  static capitalizeWords(str: string) {
    return str.replace(/(?:^|\s)\S/g, (a) => {
      return a.toUpperCase();
    });
  };

  static formatMoney(money: number) {
    return new Intl.NumberFormat().format(money);
  }

  static formatMoneyWithDot(money: number) {
    return new Intl.NumberFormat('vi-VN').format(money);
  }

  static getFullName(firstName: string, middleName?: string, lastName?: string): string {
    return [firstName, middleName, lastName].filter(Boolean).join(' ').trim();
  }

  static async mqLogger(params: MQLoggerPrarams): Promise<void> {
    /** khong log o local */
    if (process.env.NODE_ENV === 'local') return;

    return; // trien khai sau

    const channelWrapper = await this.rabbitmq.getChannel();

    channelWrapper.publish(
      'worker.service.tracemq.exchange',
      'worker.tracemq.create_service_log.routing',
      Buffer.from(JSON.stringify({ params })), {
      persistent: true, // Make the message persistent (survive server restarts)
      mandatory: true, // Return the message as unhandled if no queues are bound
      timestamp: Date.now(), // Message timestamp
      correlationId: NanoId.generateCorrelationId()
    });
  }

  static async thirdPartyLogger(params: ThirdPartyLoggerParams): Promise<void> {
    /** khong log o local */
    if (process.env.NODE_ENV === 'local') return;

    return; // trien khai sau

    const channelWrapper = await this.rabbitmq.getChannel();

    channelWrapper.publish(
      'worker.service.tracemq.exchange',
      'worker.tracemq.create_3party_log.routing',
      Buffer.from(JSON.stringify({ params })), {
      persistent: true, // Make the message persistent (survive server restarts)
      mandatory: true, // Return the message as unhandled if no queues are bound
      timestamp: Date.now(), // Message timestamp
      correlationId: NanoId.generateCorrelationId()
    });
  }

  static topicMatch(pattern: string, routingKey: string): boolean {
    const patternParts = pattern.split('.');
    const keyParts = routingKey.split('.');

    for (let i = 0; i < patternParts.length; i++) {
      const p = patternParts[i];
      const k = keyParts[i];

      if (p === '#') return true; // matches remaining parts
      if (p === '*') continue;    // matches exactly one word
      if (p !== k) return false;
    }

    return patternParts.length === keyParts.length;
  }
}