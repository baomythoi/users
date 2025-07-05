export interface FindAllParams {
  merchantId: number;
  userId: number;
  ignoreYourself?: boolean;
}

export interface ActiveParams {
  contractNo: string;
  userId: number;
  username: string;
  merchantId: number;
  agencyId: number;
  fullname: string;
  gender: 1 | 2;
  dob: string;
  address: string;
  ewalletCode: 'payme' | 'internal_wallet';
  privateId: string;
  privateIdType: string;
  privateIdDate: string;
  privateIdPlace: string;
  privateIdFrontUrl: string;
  privateIdBackUrl: string;
  signatureUrl: string;
  email: string;
  taxCode: string;
  paymentType: 1 | 2;
}

export interface CreateContractParams {
  uid: string;
}