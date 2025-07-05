import dbConfig from '@configs/db.config';
import UserPortalModel from '@models/primary/user-portal.model';

class UserPortalReplicaModel extends UserPortalModel {
}

export default UserPortalReplicaModel.bindKnex(dbConfig.getReadKnex());