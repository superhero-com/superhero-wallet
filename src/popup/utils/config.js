import { TX_TYPE, VM_VERSIONS, ABI_VERSIONS } from '@aeternity/aepp-sdk/es/tx/builder/schema';
import BigNumber from 'bignumber.js';

export const testAccount = {
  mnemonic: 'media view gym mystery all fault truck target envelope kit drop fade',
  publicKey: 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5',
};

export const popupProps = {
  connectConfirm: {
    type: 'connectConfirm',
    action: {
      params: { name: 'AEPP', networkId: 'ae_uat', version: 1 },
      method: 'connection.open',
    },
    url: 'http://localhost:5000/aepp/aepp',
    name: 'AEPP',
    protocol: 'http:',
    host: 'localhost',
  },
  messageSign: {
    type: 'messageSign',
    action: { params: { message: 'test' }, method: 'message.sign' },
    url: 'http://localhost:5000/aepp/aepp',
    name: 'AEPP',
    protocol: 'http:',
    host: 'localhost',
  },
  sign: {
    type: 'sign',
    action: {
      params: {
        tx:
          'tx_+FkMAaEB3CgyWh2tdZqs4BJVyb/oKE3hK81oYzteWEKnjfZSZ2ehAaH5Fh3pFTFpn4Qi3igqgWqqC8mMZN/OgZ74yFfWCM/thwONfqTGgACGD0w2IAgAAIG+gKIX7fM=',
        returnSigned: false,
      },
      method: 'transaction.sign',
    },
    url: 'http://localhost:5000/aepp/aepp',
    name: 'AEPP',
    protocol: 'http:',
    host: 'localhost',
  },
  base: {
    type: 'sign',
    action: { params: { returnSigned: false }, method: 'transaction.sign' },
    url: 'http://localhost:5000/aepp/aepp',
    name: 'AEPP',
    protocol: 'http:',
    host: 'localhost',
  },
};

export const recipientId = 'ak_2ELPCWzcTdiyYuumjaV4D7kE843d1Ts27zH1Y2LBMKDbNtfq1Q';
export const MAX_UINT256 = BigNumber(2).exponentiatedBy(256).minus(1);
const commonParams = {
  amount: 100000000000000000,
  ttl: MAX_UINT256,
  nonce: MAX_UINT256,
  fee: 10000000000000000,
  gas: 1579000,
  gasPrice: 1000000000,
  waitMined: true,
  denomination: 'aettos',
  clientTtl: 84600,
  nameTtl: 50000,
  nameFee: 0,
  deposit: 0,
  options: '',
  dryRunAccount: {
    pub: 'ak_11111111111111111111111111111111273Yts',
    amount: 100000000000000000000000000000000000,
  },
  queryFee: 30000,
  oracleTtl: {
    type: 'delta',
    value: 500,
  },
  queryTtl: {
    type: 'delta',
    value: 10,
  },
  responseTtl: {
    type: 'delta',
    value: 10,
  },
  ctVersion: { abiVersion: ABI_VERSIONS.SOPHIA, vmVersion: VM_VERSIONS.SOPHIA },
  abiVersion: ABI_VERSIONS.SOPHIA,
  callData:
    'cb_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDJfUrsdAtW6IZtMvhp0+eVDUiQivrquyBwXrl/ujPLcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQQwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUEMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJvjRF',
};
export const txParams = {
  [TX_TYPE.contractCreate]: {
    ownerId: testAccount.publicKey,
    code:
      'cb_+LBGA6DK15BWhAK4E5OWH1kkfhQIx/qEDTVv8hrfY/bk13cN88C4g7hT/iiALJYANwGXQDcAGgaCAAEDP/5E1kQfADcANwAaDoKfAYEKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgEDP/6LoCthADcAl0ABAoKqLwMRKIAsliVzZXRfYnl0ZXMRRNZEHxFpbml0EYugK2ElZ2V0X2J5dGVzgi8AhTQuMi4wABHX/Rk=',
    ...commonParams,
  },
  [TX_TYPE.contractCall]: {
    contractId: 'ct_ym8eXWR2YfQZcMaXA8GFid9aarfCozGkeMcRHYVCVoBdVMzio',
    callerId: testAccount.publicKey,
    ...commonParams,
  },
  [TX_TYPE.spend]: {
    senderId: testAccount.publicKey,
    recipientId,
    ...commonParams,
  },
};
