/* eslint-disable camelcase */

import { Contract, ContractMethodsBase, Encoded } from '@aeternity/aepp-sdk';
import type { INetworkProtocolSettings } from '@/types';

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
  tip: (recipientId: Encoded.AccountAddress, note: string) => void;
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
