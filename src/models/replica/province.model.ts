import dbConfig from '@configs/db.config';
import ProvinceModel from '@models/primary/province.model';

class ProvinceReplicaModel extends ProvinceModel {
}

export default ProvinceReplicaModel.bindKnex(dbConfig.getReadKnex());