import { SCHEMA } from '@aeternity/aepp-sdk';
import {
  MAX_UINT256,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_SIGN,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_RAW_SIGN,
} from './constants';

export const testAccount = {
  mnemonic: 'media view gym mystery all fault truck target envelope kit drop fade',
  address: 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5',
};

export const recipientId = 'ak_2ELPCWzcTdiyYuumjaV4D7kE843d1Ts27zH1Y2LBMKDbNtfq1Q';
export const contractCallAddress = 'ct_ym8eXWR2YfQZcMaXA8GFid9aarfCozGkeMcRHYVCVoBdVMzio';

export const popupProps = {
  [POPUP_TYPE_CONNECT]: {
    type: POPUP_TYPE_CONNECT,
    app: {
      url: 'http://localhost:5000/aepp/aepp',
      name: 'AEPP',
      protocol: 'http:',
      host: 'localhost',
    },
  },
  [POPUP_TYPE_MESSAGE_SIGN]: {
    type: POPUP_TYPE_MESSAGE_SIGN,
    app: {
      url: 'http://localhost:5000/aepp/aepp',
      name: 'AEPP',
      protocol: 'http:',
      host: 'localhost',
    },
    message: 'test',
  },
  [POPUP_TYPE_RAW_SIGN]: {
    type: POPUP_TYPE_RAW_SIGN,
    app: {
      url: 'http://localhost:5000/aepp/aepp',
      name: 'AEPP',
      protocol: 'http:',
      host: 'localhost',
    },
    data: 'test',
  },
  [POPUP_TYPE_SIGN]: {
    type: POPUP_TYPE_SIGN,
    app: {
      url: 'http://localhost:5000/aepp/aepp',
      name: 'AEPP',
      protocol: 'http:',
      host: 'localhost',
    },
    transaction: {
      tag: '12',
      VSN: '1',
      senderId: testAccount.address,
      recipientId,
      amount: '1000000000000000',
      fee: '16820000000000',
      ttl: '0',
      nonce: '190',
      payload: 'ba_Xfbg4g==',
    },
  },
  base: {
    type: 'sign',
    action: { params: { returnSigned: false }, method: 'transaction.sign' },
    app: {
      url: 'http://localhost:5000/aepp/aepp',
      name: 'AEPP',
      protocol: 'http:',
      host: 'localhost',
    },
  },
};

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
  ctVersion: { abiVersion: SCHEMA.ABI_VERSIONS.SOPHIA, vmVersion: SCHEMA.VM_VERSIONS.SOPHIA },
  abiVersion: SCHEMA.ABI_VERSIONS.SOPHIA,
  callData:
    'cb_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDJfUrsdAtW6IZtMvhp0+eVDUiQivrquyBwXrl/ujPLcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQQwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUEMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJvjRF',
};
export const txParams = {
  [SCHEMA.TX_TYPE.contractCreate]: {
    ownerId: testAccount.address,
    code:
      'cb_+LBGA6DK15BWhAK4E5OWH1kkfhQIx/qEDTVv8hrfY/bk13cN88C4g7hT/iiALJYANwGXQDcAGgaCAAEDP/5E1kQfADcANwAaDoKfAYEKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgEDP/6LoCthADcAl0ABAoKqLwMRKIAsliVzZXRfYnl0ZXMRRNZEHxFpbml0EYugK2ElZ2V0X2J5dGVzgi8AhTQuMi4wABHX/Rk=',
    ...commonParams,
  },
  [SCHEMA.TX_TYPE.contractCall]: {
    contractId: contractCallAddress,
    callerId: testAccount.address,
    ...commonParams,
  },
  [SCHEMA.TX_TYPE.spend]: {
    senderId: testAccount.address,
    recipientId,
    ...commonParams,
  },
};
