import dbConfig from '@configs/db.config';
import TrackingUserDailyRevenueModel from '@models/primary/tracking-user-daily-revenue.model';

class TrackingUserDailyRevenueReplicaModel extends TrackingUserDailyRevenueModel {
}

export default TrackingUserDailyRevenueReplicaModel.bindKnex(dbConfig.getReadKnex());