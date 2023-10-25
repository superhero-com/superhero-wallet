import {
  AccountGeneralized,
  hash,
  unpackTx,
  decode,
  Tag,
  encode,
  Encoded,
  Encoding,
} from '@aeternity/aepp-sdk';

// aeternity/ga-multisig-contract#b09c381c7845a92ea5471d1721b091cca943bfee
import SimpleGAMultiSigAci from '@/lib/contracts/SimpleGAMultiSigACI.json';

import type {
  IActiveMultisigTransaction,
  IDefaultComposableOptions,
  TxFunctionMultisig,
  IRawMultisigTx,
} from '@/types';
import {
  fetchJson,
  handleUnknownError,
  postJson,
} from '@/utils';
import { MULTISIG_SIMPLE_GA_BYTECODE } from '@/protocols/aeternity/config';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { useAeSdk } from './aeSdk';
import { useMultisigAccounts } from './multisigAccounts';
import { useTopHeaderData } from './topHeader';

const MULTISIG_TRANSACTION_EXPIRATION_HEIGHT = 480;

export function useMultisigTransactions({ store }: IDefaultComposableOptions) {
  const { aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();
  const { nodeNetworkId, getDryAeSdk, getAeSdk } = useAeSdk({ store });
  const { fetchCurrentTopBlockHeight } = useTopHeaderData({ store });

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
    const { activeMultisigAccount } = useMultisigAccounts({ store });
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
        isMultisigTransaction: true,
        microTime: rawTx ? Date.now() : undefined,
      };
    }
    return null;
  }

  async function postSpendTx(tx: string, txHash: string) {
    return postJson(`${aeActiveNetworkPredefinedSettings.value.multisigBackendUrl}/tx`, { body: { hash: txHash, tx } });
  }

  async function proposeTx(spendTx: Encoded.Transaction, contractId: Encoded.ContractAddress) {
    const [aeSdk, topBlockHeight] = await Promise.all([getAeSdk(), fetchCurrentTopBlockHeight()]);
    const expirationHeight = topBlockHeight + MULTISIG_TRANSACTION_EXPIRATION_HEIGHT;

    const spendTxHash = new Uint8Array(hash(
      Buffer.concat([Buffer.from(nodeNetworkId.value!), decode(spendTx)]),
    ));

    const gaContractRpc = await aeSdk.initializeContract({
      aci: SimpleGAMultiSigAci,
      address: contractId,
    });

    await gaContractRpc.propose(spendTxHash, {
      FixedTTL: [expirationHeight],
    });

    return Buffer.from(spendTxHash).toString('hex');
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
  ) {
    const [aeSdk, topBlockHeight] = await Promise.all([getAeSdk(), fetchCurrentTopBlockHeight()]);
    const expirationHeight = topBlockHeight + MULTISIG_TRANSACTION_EXPIRATION_HEIGHT;
    const gaContractRpc = await aeSdk.initializeContract({
      aci: SimpleGAMultiSigAci,
      address: contractId,
    });

    const result = await gaContractRpc[action](spendTxHash, {
      FixedTTL: [expirationHeight],
    });

    return result;
  }

  async function sendTx(
    accountId: Encoded.AccountAddress,
    spendTx: Encoded.Transaction,
    nonce: number,
  ): Promise<any> {
    const dryAeSdk = await getDryAeSdk();
    const gaContractRpc = await dryAeSdk.initializeContract({
      aci: SimpleGAMultiSigAci,
      bytecode: MULTISIG_SIMPLE_GA_BYTECODE,
    });
    return dryAeSdk.sendTransaction(spendTx, {
      authData: {
        callData: gaContractRpc._calldata.encode(gaContractRpc._name, 'authorize', [nonce]),
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
