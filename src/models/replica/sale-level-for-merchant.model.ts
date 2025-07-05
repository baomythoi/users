import dbConfig from '@configs/db.config';
import SaleLevelForMerchantModel from '@models/primary/sale-level-for-merchant.model';

class SaleLevelForMerchantReplicaModel extends SaleLevelForMerchantModel {
}

export default SaleLevelForMerchantReplicaModel.bindKnex(dbConfig.getReadKnex());