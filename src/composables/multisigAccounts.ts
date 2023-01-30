import { computed, ref } from '@vue/composition-api';
import type { Store } from 'vuex';
import multisigContract from '@aeternity/ga-multisig-contract/SimpleGAMultiSig.aes';
import { uniqBy } from 'lodash-es';
import camelcaseKeysDeep from 'camelcase-keys-deep';
import { Crypto } from '@aeternity/aepp-sdk';

import {
  fetchJson,
  LOCAL_STORAGE_PREFIX,
  MULTISIG_CREATION_STEPS,
} from '../popup/utils';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import type {
  IAccount,
  INetwork,
  IMultisigCreationStep,
  IMultisigAccountBase,
  IMultisigAccount,
} from '../types';
import { useSdk } from './sdk';

interface UseMultisigAccountsOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
}

const POLLING_INTERVAL = 5000;

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

export function useMultisigAccounts({ store }: UseMultisigAccountsOptions) {
  const { getDrySdk, getSdk } = useSdk({ store });

  const accounts = computed<IAccount[]>(() => store.getters.accounts);
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  if (!multisigAccounts.value.length) {
    multisigAccounts.value = getStoredMultisigAccounts(activeNetwork.value.networkId);
  }

  const multisigProgress = ref<IMultisigCreationStep>(MULTISIG_CREATION_STEPS.preparing);

  /**
   * @param {number} noOfConfirmations no of minimum confirmation needed to process a transaction
   * @param {string[]} signers
   */
  async function deployMultisigAccount(
    noOfConfirmations: number,
    signersAddresses: [string, string, ...string[]],
  ): Promise<IMultisigAccountBase> {
    if (noOfConfirmations > signersAddresses.length) throw Error('Number of confirmations exceed amount of signers');
    multisigProgress.value = MULTISIG_CREATION_STEPS.preparing;

    const sdk = await getSdk();
    const drySdk = await getDrySdk();

    // create a temporary account
    const gaAccount = Crypto.generateKeyPair();

    const multisigContractInstance = await drySdk.getContractInstance({
      source: multisigContract,
    });
    await multisigContractInstance.compile();
    multisigProgress.value = MULTISIG_CREATION_STEPS.compiled;

    const contractArgs = [noOfConfirmations, signersAddresses];
    // Build Attach transaction
    const attachTX = await drySdk.gaAttachTx({
      ownerId: gaAccount.publicKey,
      code: multisigContractInstance.bytecode,
      callData: multisigContractInstance.calldata.encode(multisigContractInstance._name, 'init', contractArgs),
      authFun: Crypto.hash('authorize'),
      gas: await multisigContractInstance._estimateGas('init', contractArgs),
      options: {
        innerTx: true,
      },
    });
    const { rawTx } = await drySdk.send(attachTX.tx, {
      innerTx: true,
      onAccount: gaAccount,
    });
    // Submit transaction using the default account
    await sdk.payForTransaction(rawTx, {
      waitMined: true,
      modal: false,
    });
    multisigProgress.value = MULTISIG_CREATION_STEPS.deployed;

    const gaContract = await drySdk.getAccount(gaAccount.publicKey);
    multisigProgress.value = MULTISIG_CREATION_STEPS.created;

    return {
      contractId: gaContract.contractId,
      multisigAccountId: gaAccount.publicKey,
    };
  }

  function setActiveMultisigAccountId(multisigAccountId: string) {
    activeMultisigAccountId.value = multisigAccountId;
  }

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
        const contractInstance = await sdk.getContractInstance({
          source: multisigContract,
          contractAddress: contractId,
        });

        const nonce = (await contractInstance.methods.get_nonce()).decodedResult;
        const signers = (await contractInstance.methods.get_signers()).decodedResult;
        const version = (await contractInstance.methods.get_version()).decodedResult;

        const consensus = (
          await contractInstance.methods.get_consensus_info()
        ).decodedResult as any;

        if (consensus.tx_hash) {
          consensus.tx_hash = Buffer.from(consensus.tx_hash).toString('hex');
        }
        consensus.expiration_height = Number(consensus.expiration_height);
        consensus.confirmations_required = Number(consensus.confirmations_required);

        return {
          ...camelcaseKeysDeep(consensus),
          ...otherMultisig,
          nonce: Number(nonce),
          signers,
          version,
          contractId,
          balance: (gaAccountId && (await sdk.balance(gaAccountId))) || 0,
          address: gaAccountId,
          multisigAccountId: gaAccountId,
        };
      }),
    ))
      .sort((a, b) => {
        if (a.txHash && !b.txHash) return -1;
        if (!a.txHash && b.txHash) return 1;
        if (isSignatureRequested(a) && !isSignatureRequested(b)) return -1;
        if (!isSignatureRequested(a) && isSignatureRequested(b)) return 1;
        if (b.confirmedBy.length && a.confirmedBy.length) {
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
  }

  const activeMultisigAccount = computed(() => multisigAccounts.value
    .find((account) => account.address === activeMultisigAccountId.value));

  initPollingWatcher(() => updateMultisigAccounts(), POLLING_INTERVAL);

  return {
    multisigAccounts,
    multisigProgress,
    isMultisigDashboard,
    activeMultisigAccountId,
    activeMultisigAccount,
    deployMultisigAccount,
    setActiveMultisigAccountId,
    toggleMultisigDashboard,
  };
}
