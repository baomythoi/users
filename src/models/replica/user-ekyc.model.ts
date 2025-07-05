import dbConfig from '@configs/db.config';
import UserEkycModel from '@models/primary/user-ekyc.model';

class UserEkycReplicaModel extends UserEkycModel {
}

export default UserEkycReplicaModel.bindKnex(dbConfig.getReadKnex());