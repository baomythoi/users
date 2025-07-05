import dbConfig from '@configs/db.config';
import AffUserProfileModel from '@models/primary/affiliate-user-profile.model';

class AffUserProfileReplicaModel extends AffUserProfileModel {
}

export default AffUserProfileReplicaModel.bindKnex(dbConfig.getReadKnex());