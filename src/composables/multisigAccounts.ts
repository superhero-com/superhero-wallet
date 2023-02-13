import { computed, ref } from '@vue/composition-api';
import type { Store } from 'vuex';
import { uniqBy } from 'lodash-es';
import camelcaseKeysDeep from 'camelcase-keys-deep';
import { Crypto, DryRunError } from '@aeternity/aepp-sdk';
// aeternity/ga-multisig-contract#02831f1fe0818d4b5c6edb342aea252479df028b
import SimpleGAMultiSigAci from '../lib/contracts/SimpleGAMultiSigACI.json';

import {
  fetchJson,
  handleUnknownError,
  LOCAL_STORAGE_PREFIX,
  MULTISIG_CREATION_STEPS,
  convertToken,
  MAGNITUDE,
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
import { i18n } from '../store/plugins/languages';

interface UseMultisigAccountsOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
}

const SimpleGAMultiSigBytecode = 'cb_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b25faGVpZ2h0ERV7P4adLlNpbXBsZUdBTXVsdGlTaWcuY29uZmlybV9hbmRfdXBkYXRlX3R4ETLxdQlZZGlzYWJsZV9mZWVfcHJvdGVjdGlvbhE2vY8DIS5TZXQubmV3EUTWRB8RaW5pdBFYZpLQGXJlZnVzZRFgcrjnhS5TaW1wbGVHQU11bHRpU2lnLmludGVybmFsX3Jldm9rZRFg2SfnSWdldF9mZWVfcHJvdGVjdGlvbhFjUXRtJS5TZXQuc2l6ZRFlpeAPLUNoYWluLmV2ZW50EWkRZsSNLlNpbXBsZUdBTXVsdGlTaWcucmVmdXNlX2FuZF9yZXZva2URbPJXCyVhdXRob3JpemURcxd2Uh1jb25maXJtEXTaWjEtLlNldC5kZWxldGURipJkun0uU2ltcGxlR0FNdWx0aVNpZy5oYXNfY29uc2Vuc3VzEZnlH6otZ2V0X3NpZ25lcnMRoAKLeCUuTGlzdC5tYXARoDdpBjEuU2V0LnRvX2xpc3QRyxS1tR1wcm9wb3NlEdDDbLgtLlNldC5pbnNlcnQR0bdm1C0uU2V0Lm1lbWJlchHZqMEoJWdldF9ub25jZRHj8zwIJS5QYWlyLmZzdBHnnnnifS5TaW1wbGVHQU11bHRpU2lnLnZlcmlmeV90eF9mZWUR6tQZlGUuU2ltcGxlR0FNdWx0aVNpZy5leHBpcmVkEfZYXzFVdXBkYXRlX2ZlZV9wcm90ZWN0aW9uEfbWMu1laXNfZmVlX3Byb3RlY3Rpb25fZW5hYmxlZBH6lKxHRS5PcHRpb24uZm9yY2VfbXNnEfuGrxo1Lk9wdGlvbi5mb3JjZRH9kfTjGS5eMTQ0MoIvAIU2LjEuMADBfpyn';

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

export function useMultisigAccounts({ store }: UseMultisigAccountsOptions) {
  const { getDrySdk, getSdk } = useSdk({ store });

  const accounts = computed<IAccount[]>(() => store.getters.accounts);
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

  if (!multisigAccounts.value.length) {
    multisigAccounts.value = getStoredMultisigAccounts(activeNetwork.value.networkId);
  }

  const multisigProgress = ref<IMultisigCreationStep>(null);

  /**
   * @param {number} noOfConfirmations no of minimum confirmation needed to process a transaction
   * @param {string[]} signers
   */
  async function deployMultisigAccount(
    noOfConfirmations: number,
    signersAddresses: [string, string, ...string[]],
  ): Promise<IMultisigAccountBase> {
    if (noOfConfirmations > signersAddresses.length) throw Error('Number of confirmations exceed amount of signers');

    const [sdk, drySdk] = await Promise.all([getSdk(), getDrySdk()]);

    // Create a temporary account
    const gaAccount = Crypto.generateKeyPair();

    const multisigContractInstance = await drySdk.getContractInstance({
      aci: SimpleGAMultiSigAci,
      bytecode: SimpleGAMultiSigBytecode,
    });

    multisigProgress.value = MULTISIG_CREATION_STEPS.prepared;

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
            `${consensus?.confirmed_by?.length}/${consensus.confirmations_required} ${i18n.t('outOf')} ${signers.decodedResult?.length}`
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
    updateMultisigAccounts,
  };
}
