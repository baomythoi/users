import dbConfig from '@configs/db.config';
import DistrictModel from '@models/primary/district.model';

class DistrictReplicaModel extends DistrictModel {
}

export default DistrictReplicaModel.bindKnex(dbConfig.getReadKnex());