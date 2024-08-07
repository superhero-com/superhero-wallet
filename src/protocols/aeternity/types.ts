/* eslint-disable camelcase */

import { Contract, ContractMethodsBase, Encoded } from '@aeternity/aepp-sdk';
import type { AccountAddress, INetworkProtocolSettings } from '@/types';

/**
 * Settings specific to this protocol.
 */
export type AeNetworkProtocolSettings =
  | 'middlewareUrl'
  | 'backendUrl' // Tipping backend URL, rename in future to something more meaningful.

/**
 * Settings that are not editable by the user but are assigned to specific network types.
 */
export type AeNetworkProtocolPredefinedSettings =
  | 'explorerUrl'
  | 'multisigBackendUrl';

export type IAeNetworkSettings = INetworkProtocolSettings<AeNetworkProtocolSettings>;

export type IAeNetworkPredefinedSettings = Record<AeNetworkProtocolPredefinedSettings, string>;

export interface AeTippingV1ContractApi extends ContractMethodsBase {
  unclaimed_for_url: (url: string) => string;
  tip: (recipientId: Encoded.AccountAddress, note: string, options: any) => void;
  retip: (tipId: number) => void;
}

export interface AeTippingV2ContractApi extends AeTippingV1ContractApi {
  tip_token: (
    recipientId: Encoded.AccountAddress,
    note: string,
    contractId: Encoded.ContractAddress,
    amount: string
  ) => Encoded.TxHash;
  retip_token: (
    id: number,
    contactId: Encoded.ContractAddress,
    amount: number
  ) => Encoded.TxHash;
}

export interface AeTippingContracts {
  tippingV1: Contract<AeTippingV1ContractApi>;
  tippingV2?: Contract<AeTippingV2ContractApi>;
}

export interface AeTippingContractAddresses {
  tippingV1?: Encoded.ContractAddress;
  tippingV2?: Encoded.ContractAddress;
}

export interface AeDecodedCallData {
  functionName: string;
  args: string[];
}

export type ContractInitializeOptions = Omit<Parameters<typeof Contract.initialize>[0], 'onNode'>;

export interface SimpleGAMultiSigContractApi extends ContractMethodsBase {
  get_nonce: () => number;
  get_signers: () => string[];
  get_consensus_info: () => {
    confirmations_required: number;
    confirmed_by: AccountAddress[];
    expiration_height: number;
    expired: boolean;
    proposed_by: AccountAddress;
    tx_hash?: string;
  };
}

export interface BackendHealth {
  dbHealth: boolean;
  ipfsHealth: boolean;
  redisHealth: boolean;
  aeHealth: boolean;
  allHealthy: boolean;
}
