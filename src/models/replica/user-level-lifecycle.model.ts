import dbConfig from '@configs/db.config';
import UserLevelLifeCycleModel from '@models/primary/user-level-lifecycle.model';

class UserLeveLifeCycleReplicaModel extends UserLevelLifeCycleModel {
}

export default UserLeveLifeCycleReplicaModel.bindKnex(dbConfig.getReadKnex());