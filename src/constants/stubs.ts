import {
  Tag,
  AbiVersion,
  VmVersion,
  Encoded,
  AE_AMOUNT_FORMATS,
} from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
import type {
  IAppData,
  IPopupData,
  ITransaction,
  PartialDeep,
  PopupType,
  TxFunctionParsed,
} from '@/types';
import { AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import {
  POPUP_TYPE_ACCOUNT_LIST,
  POPUP_TYPE_CONNECT,
  POPUP_TYPE_MESSAGE_SIGN,
  POPUP_TYPE_RAW_SIGN,
  POPUP_TYPE_UNSAFE_SIGN,
  POPUP_TYPE_SIGN,
  PROTOCOLS,
} from './common';

export const STUB_ADDRESS: Encoded.AccountAddress = 'ak_enAPooFqpTQKkhJmU47J16QZu9HbPQQPwWBVeGnzDbDnv9dxp';
export const STUB_CONTRACT_ADDRESS = 'ct_2rWUGgaVEVytGKuovkeJiUiLvrW63Fx7acvLBb5Ee9ypqoNxL6';
export const STUB_CALL_DATA = 'cb_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDJfUrsdAtW6IZtMvhp0+eVDUiQivrquyBwXrl/ujPLcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQQwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUEMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJvjRF';
export const STUB_TX_BASE_64 = 'tx_+FEMAaEByqPFadmQk4sGtyDiquosAZyKJNmherKOhheVIEYTLCKhAcqjxWnZkJOLBrcg4qrqLAGciiTZoXqyjoYXlSBGEywiC4YPJvVhyAAAE4ALeFGB';
export const STUB_NONCE = 10000;
export const STUB_TOKEN_CONTRACT_ADDRESS = 'ct_T6MWNrowGVC9dyTDksCBrCCSaeK3hzBMMY5hhMKwvwr8wJvM8';
export const STUB_TIPPING_CONTRACT_ID_V1 = 'ct_2Cvbf3NYZ5DLoaNYAU71t67DdXLHeSXhodkSNifhgd7Xsw28Xd';
export const STUB_TIPPING_CONTRACT_ID_V2 = 'ct_2ZEoCKcqXkbz2uahRrsWeaPooZs9SdCv6pmC4kc55rD4MhqYSu';
export const STUB_TIP_NOTE = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vel interdum ligula, non consequat libero. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Nullam congue, nibh non malesuada ornare, ante metus tempor dui, a ultrices ante ut.';

export const STUB_ACCOUNT = {
  mnemonic: 'media view gym mystery all fault truck target envelope kit drop fade',
  password: 'testPassword123',
  addressAeternity: 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5' as Encoded.AccountAddress,
  addressBitcoinTestnet: 'tb1qqhzkgwgjcyr5a7h3r5ayxxs3n6e620plpx58wv',
  addressEthereum: '0x909C407d6FD235DE14db97e2234fCB71E99d6E1c',
};

export const recipientId: Encoded.AccountAddress = 'ak_2ELPCWzcTdiyYuumjaV4D7kE843d1Ts27zH1Y2LBMKDbNtfq1Q';
export const contractCallAddress: Encoded.ContractAddress = 'ct_ym8eXWR2YfQZcMaXA8GFid9aarfCozGkeMcRHYVCVoBdVMzio';

export const STUB_APP_DATA: IAppData = {
  href: 'http://localhost:5000/aepp/aepp',
  name: 'AEPP',
  protocol: 'http:',
  host: 'localhost',
};

export const STUB_POPUP_PROPS: Record<PopupType | 'base', IPopupData> = {
  [POPUP_TYPE_CONNECT]: {
    app: STUB_APP_DATA,
  },
  [POPUP_TYPE_ACCOUNT_LIST]: {
    app: STUB_APP_DATA,
  },
  [POPUP_TYPE_MESSAGE_SIGN]: {
    app: STUB_APP_DATA,
    message: 'test',
  },
  [POPUP_TYPE_RAW_SIGN]: {
    app: STUB_APP_DATA,
    txBase64: STUB_TX_BASE_64,
  },
  [POPUP_TYPE_SIGN]: {
    app: STUB_APP_DATA,
    tx: {
      type: Tag[Tag.SpendTx],
      VSN: '1',
      senderId: STUB_ACCOUNT.addressAeternity,
      recipientId,
      amount: 1000000000000000,
      fee: 16820000000000,
      nonce: 190,
      payload: 'ba_Xfbg4g==',
      arguments: [],
      callerId: STUB_ADDRESS,
      contractId: STUB_CONTRACT_ADDRESS,
    },
  },
  [POPUP_TYPE_UNSAFE_SIGN]: {

  },
  base: {
    app: STUB_APP_DATA,
    action: { params: { returnSigned: false }, method: 'transaction.sign' },
  },
};

const maxUint256 = new BigNumber(2).exponentiatedBy(256).minus(1).toNumber();
const commonParams = {
  amount: 100000000000000000,
  ttl: maxUint256,
  nonce: maxUint256,
  fee: 10000000000000000,
  gas: 1579000,
  gasPrice: 1000000000,
  waitMined: true,
  denomination: AE_AMOUNT_FORMATS.AETTOS,
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
  ctVersion: { abiVersion: AbiVersion.Sophia, vmVersion: VmVersion.Sophia },
  abiVersion: AbiVersion.Sophia,
  callData: STUB_CALL_DATA,
};

export const STUB_TX_PARAMS = {
  [Tag[Tag.ContractCreateTx]]: {
    ownerId: STUB_ACCOUNT.addressAeternity,
    code:
      'cb_+LBGA6DK15BWhAK4E5OWH1kkfhQIx/qEDTVv8hrfY/bk13cN88C4g7hT/iiALJYANwGXQDcAGgaCAAEDP/5E1kQfADcANwAaDoKfAYEKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqgEDP/6LoCthADcAl0ABAoKqLwMRKIAsliVzZXRfYnl0ZXMRRNZEHxFpbml0EYugK2ElZ2V0X2J5dGVzgi8AhTQuMi4wABHX/Rk=' as Encoded.ContractBytearray,
    ...commonParams,
  },
  [Tag[Tag.ContractCallTx]]: {
    contractId: contractCallAddress,
    callerId: STUB_ACCOUNT.addressAeternity,
    ...commonParams,
  },
  [Tag[Tag.SpendTx]]: {
    senderId: STUB_ACCOUNT.addressAeternity,
    recipientId,
    ...commonParams,
  },
};

const microTime = new Date().getTime();

export const STUB_TRANSACTIONS: Partial<Record<TxFunctionParsed, PartialDeep<ITransaction>>> = {
  spend: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      amount: 10000000000000,
      arguments: [],
      callerId: STUB_ADDRESS,
      contractId: contractCallAddress,
      fee: 16780000000000,
      type: 'SpendTx',
      senderId: STUB_ADDRESS,
      recipientId: STUB_ACCOUNT.addressAeternity,
    },
  },
  tip: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      amount: 10000000000000000,
      arguments: [
        {
          type: 'string',
          value: 'https://example.com',
        },
        {
          type: 'string',
          value: '',
        },
      ],
      callerId: STUB_ADDRESS,
      contractId: STUB_TIPPING_CONTRACT_ID_V1,
      fee: 183820000000000,
      function: 'tip',
      type: 'ContractCallTx',
    },
  },
  retip: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      amount: 200000000000000000,
      arguments: [
        {
          type: 'int',
          value: 3,
        },
      ],
      callerId: STUB_ADDRESS,
      contractId: STUB_TIPPING_CONTRACT_ID_V1,
      fee: 182200000000000,
      function: 'retip',
      type: 'ContractCallTx',
    },
  },
  tipToken: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      amount: 0,
      arguments: [
        {
          type: 'string',
          value: 'https://github.com/thepiwo',
        },
        {
          type: 'string',
          value: 'great work!',
        },
        {
          type: 'contract',
          value: STUB_TOKEN_CONTRACT_ADDRESS,
        },
        {
          type: 'int',
          value: 10000000000000000,
        },
      ],
      callerId: STUB_ADDRESS,
      contractId: STUB_TIPPING_CONTRACT_ID_V2,
      fee: 183720000000000,
      function: 'tip_token',
      type: 'ContractCallTx',
    },
  },
  retipToken: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      amount: 0,
      arguments: [
        {
          type: 'int',
          value: 3263,
        },
        {
          type: 'contract',
          value: STUB_TOKEN_CONTRACT_ADDRESS,
        },
        {
          type: 'int',
          value: 10000000000000000,
        },
      ],
      callerId: STUB_ADDRESS,
      contractId: STUB_TIPPING_CONTRACT_ID_V2,
      fee: 183000000000000,
      function: 'retip_token',
      type: 'ContractCallTx',
    },
  },
  claim: {
    protocol: PROTOCOLS.aeternity,
    claim: true,
    tx: {
      amount: 0,
      arguments: [
        {
          type: 'string',
          value: 'https://example.com',
        },
        {
          type: 'address',
          value: STUB_ADDRESS,
        },
        {
          type: 'bool',
          value: 'false',
        },
      ],
      callerId: STUB_ADDRESS,
      contractId: STUB_CONTRACT_ADDRESS,
      fee: 183640000000000,
      function: 'claim',
      type: 'ContractCallTx',
    },
  },
  transfer: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      amount: 0,
      arguments: [
        {
          type: 'address',
          value: STUB_ACCOUNT.addressAeternity,
        },
        {
          type: 'int',
          value: 1000000000000000000,
        },
      ],
      fee: 16780000000000,
      callerId: STUB_ADDRESS,
      contractId: STUB_TOKEN_CONTRACT_ADDRESS,
      function: 'transfer',
      type: 'ContractCallTx',
    },
  },
  createAllowance: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      amount: 0,
      arguments: [
        {
          type: 'address',
          value: STUB_ADDRESS,
        },
        {
          type: 'int',
          value: 1050000000000000000,
        },
      ],
      callerId: STUB_ADDRESS,
      contractId: STUB_TOKEN_CONTRACT_ADDRESS,
      fee: 182920000000000,
      function: 'create_allowance',
      type: 'ContractCallTx',
    },
  },
  changeAllowance: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      amount: 0,
      fee: 16780000000000,
      arguments: [
        {
          type: 'address',
          value: STUB_ADDRESS,
        },
        {
          type: 'int',
          value: 99900000000000000,
        },
      ],
      contractId: STUB_TOKEN_CONTRACT_ADDRESS,
      function: 'change_allowance',
      type: 'ContractCallTx',
    },
  },
  namePreclaim: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      accountId: STUB_ADDRESS,
      commitmentId: 'cm_21m1rLtN2fNT3ovBbWBQo88rPUhbmWWv6L96Z8KH2YGiEkabtZ',
      fee: 16620000000000,
      type: 'NamePreclaimTx',
    },
  },
  nameClaim: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      accountId: STUB_ADDRESS,
      fee: 16560000000000,
      name: 'test.chain',
      nameFee: 51422900000000000000,
      nameId: 'nm_cVjoMBVH5UAthDx8hEijr5dF21yex6itrxbZZUMaftL941g9G',
      type: 'NameClaimTx',
    },
  },
  nameTransfer: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      accountId: STUB_ADDRESS,
      fee: 17340000000000,
      name: 'test.chain',
      nameId: 'nm_cVjoMBVH5UAthDx8hEijr5dF21yex6itrxbZZUMaftL941g9G',
      recipientId: STUB_ADDRESS,
      type: 'NameTransferTx',
    },
  },
  incompleteTransfer: {
    protocol: PROTOCOLS.aeternity,
    incomplete: true,
    tx: {
      amount: 195697771897021980,
      callerId: STUB_ADDRESS,
      contractId: STUB_TOKEN_CONTRACT_ADDRESS,
      recipientId: STUB_ACCOUNT.addressAeternity,
      senderId: STUB_ADDRESS,
      function: 'transfer',
      type: 'ContractCallTx',
    },
    microTime,
  },
  pendingSpend: {
    protocol: PROTOCOLS.aeternity,
    pending: true,
    tx: {
      amount: 743000000000000000,
      senderId: STUB_ADDRESS,
      recipientId: STUB_ACCOUNT.addressAeternity,
      type: 'SpendTx',
    },
    microTime,
  },
  pendingTransfer: {
    protocol: PROTOCOLS.aeternity,
    pending: true,
    tx: {
      amount: 195697771897021980,
      callerId: STUB_ADDRESS,
      contractId: STUB_TOKEN_CONTRACT_ADDRESS,
      recipientId: STUB_ACCOUNT.addressAeternity,
      function: 'transfer',
      type: 'ContractCallTx',
    },
    microTime,
  },
  pendingTipAe: {
    protocol: PROTOCOLS.aeternity,
    pending: true,
    tx: {
      amount: 195697771897021980,
      callerId: STUB_ADDRESS,
      contractId: STUB_TIPPING_CONTRACT_ID_V1,
      function: 'tip',
      type: 'ContractCallTx',
      selectedTokenContractId: AE_CONTRACT_ID,
    },
    microTime,
  },
  pendingTipToken: {
    protocol: PROTOCOLS.aeternity,
    pending: true,
    tipUrl: 'http://superhero.com',
    tx: {
      amount: 195697771897021980,
      callerId: STUB_ADDRESS,
      contractId: STUB_TIPPING_CONTRACT_ID_V2,
      function: 'tip',
      type: 'ContractCallTx',
      selectedTokenContractId: STUB_TOKEN_CONTRACT_ADDRESS,
    },
    microTime,
  },
  payForGaAttach: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      fee: 5560000000000,
      tx: {
        tx: {
          fee: 163660000000000,
          type: 'GaAttachTx',
        },
      },
      type: 'PayingForTx',
    },
    microTime,
  },
  gaMetaSpend: {
    protocol: PROTOCOLS.aeternity,
    tx: {
      fee: 76440000000000,
      gaId: STUB_ADDRESS,
      tx: {
        tx: {
          amount: 2341200000000000,
          fee: 16800000000000,
          recipientId: STUB_ADDRESS,
          senderId: STUB_ADDRESS,
          type: 'SpendTx',
        },
      },
      type: 'GaMetaTx',
    },
  },
};
