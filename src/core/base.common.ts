import Pino from 'pino';
import ConvertData from '@utils/convert-data';
import Validate from '@utils/validate';
import Moment from '@utils/moment';
import Rabbitmq from '@utils/rabbitmq';
import NanoId from '@utils/nanoid';
import RedisService from '@core/base.redis';

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
}