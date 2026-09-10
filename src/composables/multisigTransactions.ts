import {
  AccountGeneralized,
  unpackTx,
  Tag,
  encode,
  Encoded,
  Encoding,
  Contract,
} from '@aeternity/aepp-sdk';

// aeternity/ga-multisig-contract#b09c381c7845a92ea5471d1721b091cca943bfee
import SimpleGAMultiSigAci from '@/protocols/aeternity/aci/SimpleGAMultiSigACI.json';

import type {
  IActiveMultisigTransaction,
  TxFunctionMultisig,
  IRawMultisigTx,
} from '@/types';
import { PROTOCOLS } from '@/constants';
import {
  fetchJson,
  handleUnknownError,
} from '@/utils';
import { MULTISIG_SIMPLE_GA_BYTECODE } from '@/protocols/aeternity/config';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { type IAeGaMetaParams, useAeGaMetaParams } from '@/protocols/aeternity/composables/aeGaMetaParams';
import { useAeSdk } from './aeSdk';
import { useMultisigAccounts } from './multisigAccounts';
import { useTopHeaderData } from './topHeader';

interface InternalOptions {
  fromAccount?: Encoded.AccountAddress;
}

const MULTISIG_TRANSACTION_EXPIRATION_HEIGHT = 480;

export function useMultisigTransactions() {
  const { aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();
  const { getDryAeSdk, getAeSdk } = useAeSdk();
  const { fetchCurrentTopBlockHeight } = useTopHeaderData();
  const { getGaMetaParams } = useAeGaMetaParams();

  async function buildSpendTx(
    senderId: Encoded.AccountAddress,
    recipientId: Encoded.AccountAddress,
    amount: string,
    payload?: string,
  ) {
    const aeSdk = await getAeSdk();

    return aeSdk.buildTx({
      tag: Tag.SpendTx,
      senderId,
      recipientId,
      amount,
      payload: encode(new TextEncoder().encode(payload), Encoding.Bytearray),
    });
  }

  /**
   * Get raw proposed transaction from multisig backend
   * @param txHash
   * @returns returns transaction if exists or null
   */
  async function fetchTransactionByHash(txHash: string): Promise<IRawMultisigTx | null> {
    return fetchJson(`${aeActiveNetworkPredefinedSettings.value.multisigBackendUrl}/tx/${txHash}`)
      .then((res) => res)
      .catch(handleUnknownError);
  }

  /**
   * Get current active multisig transaction
   * @param contractAddress multisig contract
   * @returns transaction with consensus details if exists or null
   */
  async function fetchActiveMultisigTx(): Promise<IActiveMultisigTransaction | null> {
    const { activeMultisigAccount } = useMultisigAccounts();
    const txHash = activeMultisigAccount.value?.txHash;

    if (
      txHash
      && (
        activeMultisigAccount.value?.hasPendingTransaction
        || activeMultisigAccount.value?.pending
      )
    ) {
      const rawTx = await fetchTransactionByHash(txHash);

      return {
        ...activeMultisigAccount.value,
        totalConfirmations: activeMultisigAccount.value.confirmedBy.length,
        hash: txHash,
        tx: rawTx ? unpackTx(rawTx.tx) as any : undefined,
        isMultisig: true,
        microTime: rawTx ? Date.now() : undefined,
        protocol: PROTOCOLS.aeternity,
      };
    }
    return null;
  }

  /**
   * Store the raw transaction a proposal was made for, so that co-signers can read back what they
   * are asked to confirm - the contract itself only holds its authentication hash.
   *
   * The backend re-derives that hash to make sure `tx` is really the transaction `txHash` stands
   * for, which it can only do with the same `GaMetaTx` fee and gas price the proposal was hashed
   * with. Those follow the connected node rather than an SDK constant, so they are sent along
   * instead of being left to the backend to guess.
   */
  async function postSpendTx(tx: string, txHash: string, gaMetaParams: IAeGaMetaParams) {
    const response = await fetch(`${aeActiveNetworkPredefinedSettings.value.multisigBackendUrl}/tx`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hash: txHash, tx, ...gaMetaParams }),
    });

    // A rejected write leaves the proposal on chain with no readable transaction behind it, so it
    // must not pass for a completed proposal.
    if (!response.ok) {
      const { error } = await response.json().catch(() => ({ error: undefined }));
      throw new Error(error ?? `Multisig backend responded ${response.status}`);
    }
  }

  async function proposeTx(
    spendTx: Encoded.Transaction,
    contractId: Encoded.ContractAddress,
    options?: any,
  ) {
    const [aeSdk, topBlockHeight, gaMetaParams] = await Promise.all([
      getAeSdk(),
      fetchCurrentTopBlockHeight(),
      getGaMetaParams(),
    ]);
    const expirationHeight = topBlockHeight + MULTISIG_TRANSACTION_EXPIRATION_HEIGHT;

    const spendTxHash = await aeSdk.buildAuthTxHash(spendTx, gaMetaParams);

    const gaContractRpc = await Contract.initialize({
      ...aeSdk.getContext(),
      aci: SimpleGAMultiSigAci,
      address: contractId,
    });

    const callResult = await gaContractRpc.propose(
      spendTxHash,
      { FixedTTL: [expirationHeight] },
      options || {},
    );

    return {
      proposeTxHash: Buffer.from(spendTxHash).toString('hex'),
      // Handed back so that `postSpendTx` can tell the backend which values to verify against
      gaMetaParams,
      callResult,
    };
  }

  /**
   * Used to call contract methods (confirm|refuse|revoke)
   * (revoke): can only be used by the account who proposed this transaction
   * (refuse|confirm): any signer can use this action
   * @param action TxFunctionMultisig
   * @param contractId string
   * @param spendTxHash string
   * @returns result
   */
  async function callContractMethod(
    action: TxFunctionMultisig,
    contractId: Encoded.ContractAddress,
    spendTxHash: string,
    options?: Record<string, any> & InternalOptions,
  ) {
    const [aeSdk, topBlockHeight] = await Promise.all([getAeSdk(), fetchCurrentTopBlockHeight()]);
    const expirationHeight = topBlockHeight + MULTISIG_TRANSACTION_EXPIRATION_HEIGHT;
    const gaContractRpc = await Contract.initialize({
      ...aeSdk.getContext(),
      aci: SimpleGAMultiSigAci,
      address: contractId,
    });

    const result = await gaContractRpc[action](spendTxHash, {
      FixedTTL: [expirationHeight],
      ...options,
    });

    return result;
  }

  async function sendTx(
    accountId: Encoded.AccountAddress,
    spendTx: Encoded.Transaction,
    nonce: number,
  ): Promise<any> {
    const [dryAeSdk, gaMetaParams] = await Promise.all([getDryAeSdk(), getGaMetaParams()]);
    const gaContractRpc = await Contract.initialize({
      ...dryAeSdk.getContext(),
      aci: SimpleGAMultiSigAci,
      bytecode: MULTISIG_SIMPLE_GA_BYTECODE,
    });
    return dryAeSdk.sendTransaction(spendTx, {
      authData: {
        callData: gaContractRpc._calldata.encode(gaContractRpc._name, 'authorize', [nonce]),
        // The same values `proposeTx` hashed into the proposal - the contract compares its stored
        // hash against the one the node derives from this transaction, so they have to match.
        ...gaMetaParams,
      },
      onAccount: new AccountGeneralized(accountId),
    });
  }

  return {
    buildSpendTx,
    postSpendTx,
    proposeTx,
    fetchTransactionByHash,
    sendTx,
    fetchActiveMultisigTx,
    callContractMethod,
  };
}
