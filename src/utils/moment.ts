import moment, { Moment } from 'moment';
import 'moment-timezone';

export default new class MomentWithTimezone {
  init(date: string | null = null, format: string | null = null): Moment {
    let _moment;
    if (date) {
      if (format) {
        _moment = moment(date, format);
      } else {
        _moment = moment(date);
      }
    } else {
      _moment = moment();
    }

    return _moment.tz('Asia/Ho_Chi_Minh');
  }
}