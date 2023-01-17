import { ContractMethodsBase } from '@aeternity/aepp-sdk';
import { Encoded } from '@aeternity/aepp-sdk/es/utils/encoder';
import { InputNumber, Maybe } from '.';

interface MetaInfo {
  name: string,
  symbol: string,
  decimals: string,
}

/* eslint-disable camelcase */
interface AllowanceAccounts {
  from_account: Encoded.AccountAddress,
  for_acccount: Encoded.AccountAddress,
}

type Allowances = Map<AllowanceAccounts, InputNumber>

/* eslint-disable no-unused-vars */
export interface IFungibleContractApi extends ContractMethodsBase {
  aex9_extensions: () => [string];
  meta_info: () => MetaInfo;
  total_supply: () => bigint;
  owner: () => Encoded.AccountAddress;
  balances: () => bigint;
  balance: (address: Encoded.AccountAddress) => Maybe<bigint>
  transfer: (address: Encoded.AccountAddress, int: bigint) => void;
  allowances: () => Allowances;
  allowance: (allowance: AllowanceAccounts) => Maybe<bigint>;
  allowance_for_caller: (address: Encoded.AccountAddress) => Maybe<bigint>;
  transfer_allowance:
    (from: Encoded.AccountAddress, to: Encoded.AccountAddress, int: InputNumber) => void;
  create_allowance: (address: Encoded.AccountAddress, int: bigint) => void;
  change_allowance: (address: Encoded.AccountAddress, int: bigint) => void;
  reset_allowance: (address: Encoded.AccountAddress) => void;
  burn: (int: bigint) => void;
  mint:(address: Encoded.AccountAddress, int: bigint) => void;
  swap: () => void;
  check_swap: (address: Encoded.AccountAddress) => void;
  swapped: () => Map<Encoded.AccountAddress, bigint>
}
