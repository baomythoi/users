import dbConfig from '@configs/db.config';
import TrackingRevenueModel from '@models/primary/tracking-user-revenue.model';

class TrackingRevenueReplicaModel extends TrackingRevenueModel {
}

export default TrackingRevenueReplicaModel.bindKnex(dbConfig.getReadKnex());