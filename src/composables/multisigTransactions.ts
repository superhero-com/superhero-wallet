import { computed } from '@vue/composition-api';
import { MemoryAccount, Crypto, TxBuilder } from '@aeternity/aepp-sdk';
import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';
import multisigContract from '@aeternity/ga-multisig-contract/SimpleGAMultiSig.aes';
// aeternity/ga-multisig-contract#b09c381c7845a92ea5471d1721b091cca943bfee
import SimpleGAMultiSigAci from '../lib/contracts/SimpleGAMultiSigACI.json';

import {
  fetchJson,
  postJson,
  handleUnknownError,
} from '../popup/utils';
import { useSdk } from './sdk';
import type {
  IActiveMultisigTx,
  IDefaultComposableOptions,
  IMultisigFunctionTypes,
  INetwork,
  IRawMultisigTx,
  ITransaction,
} from '../types';

const MULTISIG_TRANSACTION_EXPIRATION_HEIGHT = 50;

export function useMultisigTransactions({ store }: IDefaultComposableOptions) {
  const { getDrySdk, getSdk } = useSdk({ store });

  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  async function buildSpendTx(
    senderId: string,
    recipientId: string,
    amount: number,
    payload: string,
  ) {
    const sdk = await getSdk();

    return sdk.spendTx({
      senderId,
      recipientId,
      amount,
      payload,
    });
  }

  /**
   * Get raw proposed transaction from multisig backend
   * @param txHash
   * @returns returns transaction if exists or null
   */
  async function fetchTransactionByHash(txHash: string): Promise<IRawMultisigTx | null> {
    return fetchJson(`${activeNetwork.value.multisigBackendUrl}/tx/${txHash}`)
      .then((res) => res)
      .catch(handleUnknownError);
  }

  /**
   * Get current active multisig transaction
   * @param contractAddress multisig contract
   * @returns transaction with consensus details if exists or null
   */
  async function fetchActiveMultisigTx(contractAddress: string): Promise<IActiveMultisigTx | null> {
    const sdk = await getSdk();

    const gaContractRpc = await sdk.getContractInstance({
      aci: SimpleGAMultiSigAci,
      contractAddress,
    });
    const txConsensus = (await gaContractRpc.methods.get_consensus_info()).decodedResult;
    const signers = (await gaContractRpc.methods.get_signers()).decodedResult;

    if (txConsensus.tx_hash) {
      const hash = Buffer.from(txConsensus.tx_hash).toString('hex');
      const rawTx = await fetchTransactionByHash(hash);

      return {
        totalConfirmations: txConsensus.confirmed_by.length,
        confirmationsRequired: txConsensus.confirmations_required,
        confirmedBy: txConsensus.confirmed_by,
        hasConsensus: txConsensus.hasConsensus,
        signers,
        hash,
        tx: rawTx ? (TxBuilder.unpackTx(rawTx.tx)).tx : null,
        isMultisigTransaction: true,
      };
    }
    return null;
  }

  async function postSpendTx(tx: string, txHash: string) {
    return postJson(`${activeNetwork.value.multisigBackendUrl}/tx`, { body: { hash: txHash, tx } });
  }

  async function proposeTx(spendTx: string, contractId: string) {
    const sdk = await getSdk();
    const expirationHeight = (
    (await sdk.api.getTopHeader())?.height + MULTISIG_TRANSACTION_EXPIRATION_HEIGHT
    );
    const spendTxHash = new Uint8Array(Crypto.hash(
      Buffer.concat([Buffer.from(sdk.getNetworkId()), decode(spendTx)]),
    ));

    const gaContractRpc = await sdk.getContractInstance({
      aci: SimpleGAMultiSigAci,
      contractAddress: contractId,
    });

    await gaContractRpc.methods.propose.send(spendTxHash, {
      FixedTTL: [expirationHeight],
    });
    return Buffer.from(spendTxHash).toString('hex');
  }

  /**
   * Used to call contract methods (confirm|refuse|revoke)
   * (revoke): can only be used by the account who proposed this transaction
   * (refuse|confirm): any signer can use this action
   * @param action IMultisigFunctionTypes
   * @param contractId string
   * @param spendTxHash string
   * @returns result
   */
  async function callContractMethod(
    action: IMultisigFunctionTypes,
    contractId: string,
    spendTxHash: string,
  ) {
    const sdk = await getSdk();
    const expirationHeight = (
    (await sdk.api.getTopHeader())?.height + MULTISIG_TRANSACTION_EXPIRATION_HEIGHT
    );
    const gaContractRpc = await sdk.getContractInstance({
      aci: SimpleGAMultiSigAci,
      contractAddress: contractId,
    });

    const result = await gaContractRpc.methods[action].send(spendTxHash, {
      FixedTTL: [expirationHeight],
    });

    return result;
  }

  async function sendTx(accountId: string, spendTx: string, nonce: number): Promise<ITransaction> {
    const drySdk = await getDrySdk();
    return drySdk.send(spendTx, {
      // TODO: use aci after update to a newer sdk
      authData: { source: multisigContract, args: [nonce] },
      onAccount: MemoryAccount({ gaId: accountId }),
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
