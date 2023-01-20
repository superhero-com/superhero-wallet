import { computed } from '@vue/composition-api';
import multisigContract from '@aeternity/ga-multisig-contract/SimpleGAMultiSig.aes';
import type { Store } from 'vuex';
import {
  MemoryAccount, Crypto,
} from '@aeternity/aepp-sdk';
import { decode } from '@aeternity/aepp-sdk/es/tx/builder/helpers';

import {
  fetchJson,
  postJson,
} from '../popup/utils';
import type {
  INetwork,
} from '../types';
import { useSdk } from './sdk';

interface UseMultisigTransactionsOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
}

const MULTISIG_TRANSACTION_EXPIRATION_HEIGHT = 50;

export function useMultisigTransactions({ store }: UseMultisigTransactionsOptions) {
  const { getDrySdk, getSdk } = useSdk({ store });
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  async function buildSpendTx(
    senderId: string,
    recipientId: string,
    amount: number,
  ) {
    const sdk = await getSdk();

    return sdk.spendTx({
      senderId,
      recipientId,
      amount,
    });
  }

  async function getTransactionByHash(txHash: string) {
    return fetchJson(`${activeNetwork.value.multisigBackendUrl}/tx/${txHash}`);
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
      source: multisigContract,
      contractAddress: contractId,
    });

    await gaContractRpc.methods.propose.send(spendTxHash, {
      FixedTTL: [expirationHeight],
    });
    return Buffer.from(spendTxHash).toString('hex');
  }

  async function confirmTx(contractId: string, spendTxHash: string) {
    const sdk = await getSdk();
    const expirationHeight = (
    (await sdk.api.getTopHeader())?.height + MULTISIG_TRANSACTION_EXPIRATION_HEIGHT
    );
    const gaContractRpc = await sdk.getContractInstance({
      source: multisigContract,
      contractAddress: contractId,
    });

    await gaContractRpc.methods.confirm.send(spendTxHash, {
      FixedTTL: [expirationHeight],
    });
  }

  async function revokeTx(spendTxHash: string, contractId: string) {
    const sdk = await getSdk();
    const gaContractRpc = await sdk.getContractInstance({
      source: multisigContract,
      contractAddress: contractId,
    });

    await gaContractRpc.methods.revoke.send(
      Uint8Array.from(Buffer.from(spendTxHash, 'hex')),
    );
  }

  async function sendTx(accountId: string, spendTx: string, nonce: number) {
    const drySdk = await getDrySdk();
    await drySdk.send(spendTx, {
      authData: { source: multisigContract, args: [nonce] },
      onAccount: MemoryAccount({ gaId: accountId }),
    });
  }
  return {
    buildSpendTx,
    postSpendTx,
    proposeTx,
    confirmTx,
    revokeTx,
    getTransactionByHash,
    sendTx,
  };
}
