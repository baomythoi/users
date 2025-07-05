import dbConfig from '@configs/db.config';
import TrackingAccessModel from '@models/primary/tracking-access-management.model';

class TrackingAccessReplicaModel extends TrackingAccessModel {
}

export default TrackingAccessReplicaModel.bindKnex(dbConfig.getReadKnex());