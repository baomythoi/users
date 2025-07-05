import dbConfig from '@configs/db.config';
import TrackingUserUpgradeModel from '@models/primary/tracking-user-upgrade.model';

class TrackingUserUpgradeReplicaModel extends TrackingUserUpgradeModel {
}

export default TrackingUserUpgradeReplicaModel.bindKnex(dbConfig.getReadKnex());