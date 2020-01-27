/* eslint-disable prettier/prettier */
import BigNumber from 'bignumber.js';
import { TxBuilder } from '@aeternity/aepp-sdk/es';
import { OBJECT_ID_TX_TYPE, TX_TYPE, VM_VERSIONS, ABI_VERSIONS } from '@aeternity/aepp-sdk/es/tx/builder/schema';

export const MAGNITUDE = 18;
export const MAGNITUDE_EXA = 18;
export const MAGNITUDE_GIGA = 9;
export const MAGNITUDE_MICRO = -6;
export const MAGNITUDE_PICO = -12;
export const MINPASSWORDLENGTH = 8;
export const TX_TYPES = {
  'txSign':TX_TYPE.spend,
  'contractCall':TX_TYPE.contractCall,
  'contractCreate':TX_TYPE.contractCreate,
  'namePreClaim': TX_TYPE.namePreClaim,
  'nameClaim': TX_TYPE.nameClaim,
  'nameBid': TX_TYPE.nameClaim,
  'nameUpdate': TX_TYPE.nameUpdate
}

export const HDWALLET_METHODS = [
  'unlockWallet',
  'generateWallet',
  'getKeypair',
  'getAccount',
  'isLoggedIn'
]

export const AEX2_METHODS = [
  'changeAccount',
  'addAccount',
  'switchNetwork'
]

const STUB_ADDRESS = 'ak_enAPooFqpTQKkhJmU47J16QZu9HbPQQPwWBVeGnzDbDnv9dxp';
const STUB_CALLDATA = 'cb_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACDJfUrsdAtW6IZtMvhp0+eVDUiQivrquyBwXrl/ujPLcgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJQQwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACUEMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJvjRF'
export const MAX_UINT256 = BigNumber(2).exponentiatedBy(256).minus(1);
const MIN_SPEND_TX_FEE_STRING = TxBuilder.calculateMinFee(
    'spendTx', {
    params: {
      senderId: STUB_ADDRESS,
      recipientId: STUB_ADDRESS,
      amount: MAX_UINT256,
      ttl: MAX_UINT256,
      nonce: MAX_UINT256,
    },
  }
);

export const calculateFee = (type,params) => {
  let MIN_FEE = TxBuilder.calculateMinFee(type, {
    params: {
      senderId: STUB_ADDRESS,
      recipientId: STUB_ADDRESS,
      amount: MAX_UINT256,
      ttl: MAX_UINT256,
      nonce: MAX_UINT256,
      ctVersion:{abiVersion:ABI_VERSIONS.SOPHIA,vmVersion:VM_VERSIONS.SOPHIA},
      abiVersion:ABI_VERSIONS.SOPHIA,
      callData: STUB_CALLDATA,
      ...params
    }
  })
  let min = BigNumber(MIN_FEE).shiftedBy(-MAGNITUDE)
  let max = min.multipliedBy(10);
  return {
    min,
    max
  }
}

export const MIN_SPEND_TX_FEE = BigNumber(MIN_SPEND_TX_FEE_STRING).shiftedBy(-MAGNITUDE);
export const MAX_REASONABLE_FEE = MIN_SPEND_TX_FEE.multipliedBy(10);

export const toMicro = value => value.shiftedBy(-MAGNITUDE_MICRO).toFixed();

export const MIN_SPEND_TX_FEE_MICRO = toMicro(MIN_SPEND_TX_FEE);
export const MAX_REASONABLE_FEE_MICRO = toMicro(MAX_REASONABLE_FEE);

export const DEFAULT_NETWORK = 'Testnet'
export const networks = {
  Testnet: {
    url: 'https://sdk-testnet.aepps.com',
    internalUrl: 'https://sdk-testnet.aepps.com',
    networkId: 'ae_uat',
    middlewareUrl: 'https://testnet.aeternal.io',
    explorerUrl: 'https://testnet.aeternal.io',
    compilerUrl: 'https://latest.compiler.aepps.com',
    tokenRegistry: 'ct_UAzV9RcXEMsFcUCmrPN4iphbZroM7EHk3wvdidDYgZGGBo3hV',
    tokenRegistryLima: 'ct_Dnwribmd21YrxSQnqXCB5vTFPrgYJx2eg2TrbLvbdyEbTMejw',
    tipContract: "ct_23RBxJBhNwixiiaKFJNKSig3yYKUDwC5iouaEGjQsogNvkGS3M"
  },
  Mainnet: {
    url: 'https://sdk-mainnet.aepps.com',
    internalUrl: 'https://sdk-mainnet.aepps.com',
    networkId: 'ae_mainnet',
    middlewareUrl: 'https://mainnet.aeternal.io/',
    explorerUrl: 'https://mainnet.aeternal.io',
    compilerUrl: 'https://compiler.aepps.com',
    tokenRegistry: 'ct_UAzV9RcXEMsFcUCmrPN4iphbZroM7EHk3wvdidDYgZGGBo3hV',
    tokenRegistryLima: 'ct_UAzV9RcXEMsFcUCmrPN4iphbZroM7EHk3wvdidDYgZGGBo3hV',
    tipContract: 'ct_cT9mSpx9989Js39ag45fih2daephb7YsicsvNdUdEB156gT5C'
  }
}

export const TX_LIMIT_PER_DAY = 2000
export const TIPPING_CONTRACT = 
`@compiler >= 4

include "List.aes"
include "Func.aes"
include "Option.aes"

contract WaelletTipAnyBasic =

  record state = 
    { tips          : map(string * int, tip)
    , tips_flat     : map(string, int) }

  record tip = 
    { sender        : address
    , received_at   : int
    , repaid        : bool
    , amount        : int
    , note          : option(string) }
    
  datatype event = 
    TipReceived(address, int, string)
    | TipWithdrawn(address, int, string)

  entrypoint init () : state =
    { tips = {},
      tips_flat = {} }

  payable stateful entrypoint tip (url: string, note: option(string)) : unit =
    put(state{ tips[(url, size(url))] = new_tip(url, note),
               tips_flat[url = 0] @ n = n + 1 })
    Chain.event(TipReceived(Call.caller, Call.value, url))

  stateful entrypoint withdraw (url : string) : unit =
    // aggregate all tips for the present url which are not claimed yet
    Chain.spend(Call.caller, 0)

  entrypoint tips_for_url(url : string) = tips_by_key(url)
  entrypoint get_state() : state = state
  
  stateful entrypoint claim(url: string) =
    // aggregate tips
    let amount = aggregate_unpaid_tips(url)
    let updated_tips = List.map((x) => x{repaid = true}, tips_for_url(url))
    Chain.spend(Call.caller, amount)
    Chain.event(TipWithdrawn(Call.caller, amount, url))

  entrypoint unpaid(url : string) =
    aggregate_unpaid_tips(url)
  
  function aggregate_unpaid_tips(url : string) =
    List.sum(List.map((x) => x.amount, List.filter((x) => x.repaid == false, tips_for_url(url))))
    
  function tips_by_key(key : string) =
    [ state.tips[(key, n)] | n <- [0..size(key) - 1] ]

  function size(key : string) : int = state.tips_flat[key = 0]

  stateful function new_tip(url : string, note: option(string)) : tip =
    { sender        = Call.caller,
      received_at   = Chain.timestamp,
      repaid        = false,
      amount        = Call.value,
      note          = note }`