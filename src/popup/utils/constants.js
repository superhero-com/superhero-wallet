/* eslint-disable prettier/prettier */
import BigNumber from 'bignumber.js';
import { TxBuilder } from '@aeternity/aepp-sdk/es';
import { TX_TYPE, VM_VERSIONS, ABI_VERSIONS } from '@aeternity/aepp-sdk/es/tx/builder/schema';

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

export const AEX2_METHODS = {
  CHANGE_ACCOUNT:'CHANGE_ACCOUNT',
  ADD_ACCOUNT: 'ADD_ACCOUNT',
  SWITCH_NETWORK: 'SWITCH_NETWORK',
  LOGOUT: 'LOGOUT',
  INIT_RPC_WALLET: 'INIT_RPC_WALLET'
}

export const NOTIFICATION_METHODS = {
  SWITCH_NETWORK: 'SWITCH_NETWORK'
}

export const CONNECTION_TYPES = {
  EXTENSION: "EXTENSION",
  POPUP: "POPUP",
  OTHER: "OTHER"
}

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
  const MIN_FEE = TxBuilder.calculateMinFee(type, {
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
  const min = BigNumber(MIN_FEE).shiftedBy(-MAGNITUDE)
  const max = min.multipliedBy(10);
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
export const DEFAULT_NETWORK = typeof process.env.NETWORK !== 'undefined' ? process.env.NETWORK.trim() : 'Mainnet'
export const networks = {
  Testnet: {
    url: 'https://testnet.aeternal.io',
    internalUrl: 'https://testnet.aeternal.io',
    networkId: 'ae_uat',
    middlewareUrl: 'https://testnet.aeternal.io',
    explorerUrl: 'https://testnet.aeternal.io',
    compilerUrl: 'https://latest.compiler.aepps.com',
    tokenRegistry: 'ct_UAzV9RcXEMsFcUCmrPN4iphbZroM7EHk3wvdidDYgZGGBo3hV',
    tokenRegistryLima: 'ct_Dnwribmd21YrxSQnqXCB5vTFPrgYJx2eg2TrbLvbdyEbTMejw',
    tipContract: "ct_YpQpntd6fi6r3VXnGW7vJiwPYtiKvutUDY35L4PiqkbKEVRqj"
  },
  Mainnet: {
    url: 'https://mainnet.aeternal.io',
    internalUrl: 'https://mainnet.aeternal.io',
    networkId: 'ae_mainnet',
    middlewareUrl: 'https://mainnet.aeternal.io/',
    explorerUrl: 'https://mainnet.aeternal.io',
    compilerUrl: 'https://compiler.aepps.com',
    tokenRegistry: 'ct_UAzV9RcXEMsFcUCmrPN4iphbZroM7EHk3wvdidDYgZGGBo3hV',
    tokenRegistryLima: 'ct_UAzV9RcXEMsFcUCmrPN4iphbZroM7EHk3wvdidDYgZGGBo3hV',
    tipContract: 'ct_YpQpntd6fi6r3VXnGW7vJiwPYtiKvutUDY35L4PiqkbKEVRqj'
  }
}
export const TIP_SERVICE = 'https://backend.z52da5wt.xyz/claim/submit';

export const TX_LIMIT_PER_DAY = 2000
export const TIPPING_CONTRACT =
`@compiler >= 4

include "List.aes"
include "Func.aes"
include "Option.aes"

payable contract WaelletTipAnyBasic =

  record state = 
    { tips          : map(string * int, tip)
    , tips_flat     : map(string, int)
    , pay_for_tx_service : address }

  record tip = 
    { sender        : address
    , received_at   : int
    , repaid        : bool
    , amount        : int
    , note          : option(string) }
    
  datatype event = 
    TipReceived(address, int, string)
    | TipWithdrawn(address, int, string)

  entrypoint init (relayer: address) : state =
    { tips = {},
      tips_flat = {},
      pay_for_tx_service = relayer }

  payable stateful entrypoint tip (url: string, note: option(string)) : unit =
    put(state{ tips[(url, size(url))] = new_tip(url, note),
               tips_flat[url = 0] @ n = n + 1 })
    Chain.event(TipReceived(Call.caller, Call.value, url))

  entrypoint tips_for_url(url : string) = tips_by_key(url)
  entrypoint get_state() : state = state
  
  stateful entrypoint claim(url: string, pay_to : address) =
    allowed()
    let amount = aggregate_unpaid_tips(url)
    do_the_stuff(url, size(url) - 1)
    Chain.spend(pay_to, amount)
    Chain.event(TipWithdrawn(pay_to, amount, url))
    
  stateful function do_the_stuff(url, i) =
    if(i < 0) ()
    else
      put(state{ tips[(url, i)].repaid = true })
      do_the_stuff(url, i - 1)  

  entrypoint unpaid(url : string) =
    aggregate_unpaid_tips(url)
  
  function aggregate_unpaid_tips(url : string) =
    List.sum(List.map((x) => x.amount, List.filter((x) => x.repaid == false, tips_for_url(url))))
    
  function tips_by_key(key : string) =
    [ state.tips[(key, n)] | n <- [0..size(key) - 1] ]

  function size(key : string) : int = state.tips_flat[key = 0]
  
  stateful function migrate(new_contract: address) =
    allowed()
    Chain.spend(new_contract, Contract.balance)
    
  function allowed() =
    require(Call.caller == state.pay_for_tx_service, "NOT_ALLOWED")

  stateful function new_tip(url : string, note: option(string)) : tip =
    { sender        = Call.caller,
      received_at   = Chain.timestamp,
      repaid        = false,
      amount        = Call.value,
      note          = note }`
