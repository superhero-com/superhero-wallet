import { computed, ref } from '@vue/composition-api';
import { uniqBy } from 'lodash-es';
import camelcaseKeysDeep from 'camelcase-keys-deep';
import { DryRunError } from '@aeternity/aepp-sdk';
// aeternity/ga-multisig-contract#02831f1fe0818d4b5c6edb342aea252479df028b
import SimpleGAMultiSigAci from '../lib/contracts/SimpleGAMultiSigACI.json';
import {
  LOCAL_STORAGE_PREFIX,
  MAGNITUDE,
  fetchJson,
  handleUnknownError,
  convertToken,
} from '../popup/utils';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import type {
  IAccount,
  IDefaultComposableOptions,
  INetwork,
  IMultisigAccount,
} from '../types';
import { useSdk } from './sdk';
import { i18n } from '../store/plugins/languages';

const POLLING_INTERVAL = 7000;
const LOCAL_STORAGE_MULTISIG_KEY = `${LOCAL_STORAGE_PREFIX}_multisig`;

function storeMultisigAccounts(multisigAccounts: IMultisigAccount[], networkId: string) {
  window.localStorage
    .setItem(`${LOCAL_STORAGE_MULTISIG_KEY}_${networkId}`, JSON.stringify(multisigAccounts));
}

function getStoredMultisigAccounts(networkId: string): IMultisigAccount[] {
  const storedMultisig = window.localStorage.getItem(`${LOCAL_STORAGE_MULTISIG_KEY}_${networkId}`);
  return storedMultisig ? JSON.parse(storedMultisig) : [];
}

const multisigAccounts = ref(<IMultisigAccount[]>[]);
const activeMultisigAccountId = ref('');
const isMultisigDashboard = ref(false);

const initPollingWatcher = createPollingBasedOnMountedComponents();

export function useMultisigAccounts({ store }: IDefaultComposableOptions) {
  const { getSdk } = useSdk({ store });

  const accounts = computed<IAccount[]>(() => store.getters.accounts);
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);
  const activeMultisigAccount = computed(() => multisigAccounts.value
    .find((account) => account.address === activeMultisigAccountId.value));

  if (!multisigAccounts.value.length) {
    multisigAccounts.value = getStoredMultisigAccounts(activeNetwork.value.networkId);
  }

  function setActiveMultisigAccountId(multisigAccountId: string) {
    activeMultisigAccountId.value = multisigAccountId;
  }

  /**
   * Refresh the list of the mulstisig accounts.
   */
  async function updateMultisigAccounts() {
    const sdk = await getSdk();

    let rawMultisigData: IMultisigAccount[] = [];
    try {
      await Promise.all(accounts.value.map(async ({ address }) => rawMultisigData.push(
        ...(await fetchJson(`${activeNetwork.value.multisigBackendUrl}/${address}`)),
      )));
    } catch {
      // TODO: handle failure in multisig loading
      // eslint-disable-next-line no-console
      console.log('failed to fetch multisigAccounts');
    }

    rawMultisigData = uniqBy(rawMultisigData, 'contractId');

    function isSignatureRequested(account: IMultisigAccount) {
      return (
        account.txHash
        && account.signers.some((signer: string) => (
          accounts.value.map(({ address }) => address).includes(signer)
          && !account.confirmedBy.includes(signer)
        ))
      );
    }

    const result = (await Promise.all(
      rawMultisigData.map(async ({ contractId, gaAccountId, ...otherMultisig }) => {
        try {
          const contractInstance = await sdk.getContractInstance({
            aci: SimpleGAMultiSigAci,
            contractAddress: contractId,
          });

          const [
            nonce,
            signers,
            version,
            consensusResult,
            balance,
          ] = await Promise.all([
            contractInstance.methods.get_nonce(),
            contractInstance.methods.get_signers(),
            contractInstance.methods.get_version(),
            contractInstance.methods.get_consensus_info(),
            gaAccountId ? sdk.balance(gaAccountId) : 0,
          ]);

          const consensus = consensusResult.decodedResult as any;

          if (consensus.tx_hash) {
            consensus.tx_hash = Buffer.from(consensus.tx_hash).toString('hex');
          }
          consensus.expiration_height = Number(consensus.expiration_height);
          consensus.confirmations_required = Number(consensus.confirmations_required);
          consensus.totalConfirmations = Number(consensus.confirmed_by.length);

          const consensusLabel = (
            `${consensus?.confirmed_by?.length}/${consensus.confirmations_required} ${i18n.t('common.of')} ${signers.decodedResult?.length}`
          );

          return {
            ...camelcaseKeysDeep(consensus),
            ...otherMultisig,
            nonce: Number(nonce.decodedResult),
            signers: signers.decodedResult,
            version: version.decodedResult,
            consensusLabel,
            contractId,
            balance: convertToken(balance, -MAGNITUDE),
            address: gaAccountId,
            multisigAccountId: gaAccountId,
          };
        } catch (error) {
          /**
           * Node might throw nonce mismatch error, skip the current account update
           * return the existing data and account details will be updated in the next poll.
           */
          if (!(error instanceof DryRunError)) {
            handleUnknownError(error);
          }
          return multisigAccounts.value.find((account) => account.contractId === contractId);
        }
      }),
    ))
      .filter(Boolean)
      .sort((a, b) => {
        if (a.txHash && !b.txHash) return -1;
        if (!a.txHash && b.txHash) return 1;
        if (isSignatureRequested(a) && !isSignatureRequested(b)) return -1;
        if (!isSignatureRequested(a) && isSignatureRequested(b)) return 1;
        if (
          b.confirmedBy.length
          && a.confirmedBy.length
          && b.confirmedBy.length !== a.confirmedBy.length
        ) {
          return b.confirmedBy.length - a.confirmedBy.length;
        }
        return b.balance - a.balance;
      });

    if (!activeMultisigAccountId.value) {
      setActiveMultisigAccountId(result[0]?.multisigAccountId);
    }

    multisigAccounts.value = result;
    storeMultisigAccounts(result, activeNetwork.value.networkId);
  }

  function toggleMultisigDashboard() {
    isMultisigDashboard.value = !isMultisigDashboard.value;
    store.commit('fungibleTokens/resetTokensAndTransactions');
  }

  initPollingWatcher(() => updateMultisigAccounts(), POLLING_INTERVAL);

  return {
    multisigAccounts,
    isMultisigDashboard,
    activeMultisigAccountId,
    activeMultisigAccount,
    setActiveMultisigAccountId,
    toggleMultisigDashboard,
    updateMultisigAccounts,
  };
}
