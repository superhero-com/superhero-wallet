import { SCHEMA } from '@aeternity/aepp-sdk';
import { MAX_UINT256 } from './constants';

export const testAccount = {
  mnemonic: 'media view gym mystery all fault truck target envelope kit drop fade',
  address: 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5',
};

export const STUB_CURRENCY = [{
  id: 'aeternity', symbol: 'ae', name: 'Aeternity', image: 'https://assets.coingecko.com/coins/images/1091/large/aeternity.png?1547035060', current_price: 0.076783, market_cap: 31487891, market_cap_rank: 523, fully_diluted_valuation: null, total_volume: 217034, high_24h: 0.078539, low_24h: 0.076793, price_change_24h: -0.001092194951687525, price_change_percentage_24h: -1.4025, market_cap_change_24h: -429134.39267925173, market_cap_change_percentage_24h: -1.34453, circulating_supply: 409885828.49932, total_supply: 536306702.0, max_supply: null, ath: 5.69, ath_change_percentage: -98.65091, ath_date: '2018-04-29T03:50:39.593Z', atl: 0.059135, atl_change_percentage: 29.84246, atl_date: '2020-03-13T02:29:11.856Z', roi: { times: -0.725775445642378, currency: 'usd', percentage: -72.57754456423778 }, last_updated: '2023-01-17T11:38:23.610Z',
}];

export const popupProps = {
  connectConfirm: {
    type: 'connectConfirm',
    app: {
      url: 'http://localhost:5000/aepp/aepp',
      name: 'AEPP',
      protocol: 'http:',
      host: 'localhost',
    },
  },
  messageSign: {
    type: 'messageSign',
    app: {
      url: 'http://localhost:5000/aepp/aepp',
      name: 'AEPP',
      protocol: 'http:',
      host: 'localhost',
    },
    message: 'test',
  },
  rawSign: {
    type: 'rawSign',
    app: {
      url: 'http://localhost:5000/aepp/aepp',
      name: 'AEPP',
      protocol: 'http:',
      host: 'localhost',
    },
    data: 'test',
  },
  sign: {
    type: 'sign',
    app: {
      url: 'http://localhost:5000/aepp/aepp',
      name: 'AEPP',
      protocol: 'http:',
      host: 'localhost',
    },
    transaction: {
      tag: '12',
      VSN: '1',
      senderId: 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5',
      recipientId: 'ak_2ELPCWzcTdiyYuumjaV4D7kE843d1Ts27zH1Y2LBMKDbNtfq1Q',
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

export const recipientId = 'ak_2ELPCWzcTdiyYuumjaV4D7kE843d1Ts27zH1Y2LBMKDbNtfq1Q';
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
    contractId: 'ct_ym8eXWR2YfQZcMaXA8GFid9aarfCozGkeMcRHYVCVoBdVMzio',
    callerId: testAccount.address,
    ...commonParams,
  },
  [SCHEMA.TX_TYPE.spend]: {
    senderId: testAccount.address,
    recipientId,
    ...commonParams,
  },
};
