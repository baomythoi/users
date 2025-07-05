import dbConfig from '@configs/db.config';
import UserModel from '@models/primary/user.model';

class UserReplicaModel extends UserModel {
}

export default UserReplicaModel.bindKnex(dbConfig.getReadKnex());