import { computed, ref } from '@vue/composition-api';
import type { Store } from 'vuex';
import { uniqBy } from 'lodash-es';
import camelcaseKeysDeep from 'camelcase-keys-deep';
import { Crypto } from '@aeternity/aepp-sdk';
// aeternity/ga-multisig-contract#02831f1fe0818d4b5c6edb342aea252479df028b
import SimpleGAMultiSigAci from '../lib/contracts/SimpleGAMultiSigACI.json';

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

const SimpleGAMultiSigBytecode = 'cb_+QzmRgOg4zMSaRLT2O2b54P3BR+Kzju9mduhAAZHV5er5rzMR/bAuQy4uQoR/gP+MbwANwA3BocCNwA3AZdABydHABcHFxoKAIYIPoYCBAwDr4IAAQA/DAKEDAMDDAN/DAMADAN/JwwMAEY6AgAAKCwAAkT+BCMAAgICKCwGAgIDEaA3aQYPAggMAgICAxGKkmS6DwIKDAICAgMR6tQZlA8CDgwCBAwChAwCCAwCCigsAgIMAg4nDAwA/gUnlSICNwKXQIcCNwEHNwEHNwAMAQICAxERgicfDwIAVQICAgMRNr2PA1UAAgMR0MNsuA8CBAwBAAwCAAwCAgwCBCcMCET+hiMAAgICDAEADAICDAIARPxjBgQCBAICAAYEAxFlpeAP/gpTjRIANwGXQDcADANdRVJST1JfTk9USElOR19UT19SRVZPS0UMAoYCAxH6lKxHDwIADAIADAEAVQACAxELyoirDwJvgibPGg6Gr4IAAQA/KCwAAFUARPxjBgQCBAICBgQEAxFlpeAP/gvKiKsCNwNHAJdANwSXQAdHAGdHADcANwAMAoIMAQACAxHRt2bUBwwMDAN/BgMGBwwK+wNRRVJST1JfTk9UX0FVVEhPUklaRUQBAz8oHAAEIBACBgMG/gwaHXcANwB3AQKO/hGCJx8CNwGHAjcBBzcBBwcIPQACBEY2AAAAWQAUIAAARjQAAAD+IpZQQwI3Avf39wwBAgQDEePzPAj+MvF1CQA3ADcABw6KBPsDlUVSUk9SX0ZFRV9QUk9URUNUSU9OX0FMUkVBRFlfRElTQUJMRUQMAoJVAAIDEdG3ZtQHDAr7A2FFUlJPUl9OT1RfQV9WQUxJRF9TSUdORVIaDoivggABAD8aDop/VQBE/GMGBAIEAgIKAgQDEWWl4A/+Nr2PAwI3AGfnADcAAQMvAP5E1kQfADcCB2dHADcANwAMAQJVAAIDEdG3ZtQmAAcMBvsDmUVSUk9SX0FDQ09VTlRfT0ZfR0FfTVVTVF9OT1RfQkVfU0lHTkVSDAMEDAECAgMRY1F0bSIABwwM+wNNRVJST1JfTUlOXzJfU0lHTkVSUwwBAAwBAgIDEWNRdG0iAAcMEvsDsUVSUk9SX0NPTkZJUk1BVElPTlNfRVhDRUVEX0FNT1VOVF9PRl9TSUdORVJTGg6Gr4IAAQA/Gg6Ir4IAAQEbK2+HBxr9SYz/wG+FAlQL48AaBoICGgaEABoOiv8aDowCGg6OFTEuMC4wAQM//mDZJ+cANwCHAjcANwE3AgcHAQKI/mNRdG0CNwFn5wA3AAcxBAAA/mWl4A8CNwGHBjcDl0BHAAc3ApdARwA3AZdANwKXQEcANwGXQDcBRwA3AAoNAGMCBAYICgxGNgAAAEY2AgACRjYEAARkAq9fnwGBzhODR8JcnqlvF5URonI86K0k3ZYifxwyYf/UqQuIR10AAgQBAz9GNgAAAEY2AgACY69fnwGB0m0Ahi0JysO1cTwXatk07KY6WpFwjrOaT1JJUpxIaw0AAgEDP0Y2AAAAYi9fnwGB6pQ/O02tcnqFIIXwsGoPmTnwYw1wPYaWd0QzS6qDJygAAQM/RjYAAABGNgIAAmOvX58BgdQaJB3DF6iSMYtBi0qbh1KNVgCwnSb2QSPLpazVibD7AAIBAz9GNgAAAGIvX58BgRE0phLqyuCIJl84bMSk80AMk/fQ5DL707nZsZruQVoyAAEDP0Y2AAAAYi9fnwGBtpROofQPF1HGnrxdRySrnG2BiH/QyRRLP6On80WOuy0AAQM//mzyVwsANwEHFwwDUUVSUk9SX05PX1RYX1BST1BPU0VEDAKGAgMR+pSsRw8CACIkAIwHDAb7A01FUlJPUl9OT05DRV9UT09fTE9XISQAjAcMCvsDUUVSUk9SX05PTkNFX1RPT19ISUdIDAIAAgMR6tQZlCYABwwQ+wNBRVJST1JfVFhfRVhQSVJFRAcOiiYMAz8GAxQPAm+CJs93AhYIPhYkFkY6GBYADAIAAgMRipJkugcMHPsDSUVSUk9SX05PX0NPTlNFTlNVUygsAAAgIBgHDCD7A1FFUlJPUl9VTkVRVUFMX0hBU0hFUwwCGET8YwYEAgQCAggCAgMRZaXgDw8Cb4ImzxQ2jAACGg6Gr4IAAQA/AQP/+wNVRVJST1JfTk9fQVVUSF9DT05URVhUAgMR55554gYDFP5zF3ZSADcBl0A3AAwDYUVSUk9SX05PVEhJTkdfVE9fQ09ORklSTQwChgIDEfqUrEcPAgAMAgAMAQBVAAIDEQvKiKsPAm+CJs8oLAYAVQACAxHRt2bUJgAHDAr7A11FUlJPUl9BTFJFQURZX0NPTkZJUk1FRAwCAAIDEerUGZQmAAcMEPsDQUVSUk9SX1RYX0VYUElSRUQoLAYAVQACAxHQw2y4DwIMKawGAAxE/oYjAAICAigsAABVAET8YwYEAgQCAgIEAgMRZaXgDw8Cb4ImzwwCDAIDEWNRdG0gCIQHDBoBAz8oLAAARPxjBgQCBAICBAIEAxFlpeAP/oqSZLoCNwE3BJdAB0cAZ0cANwAXDAKEKBwGAAIDEWNRdG0iAAD+meUfqgA3ACdHAAwCggQDEaA3aQb+oAKLeAI3AjcCd/cn5wAn5wEzBAIHDAg2BAIMAQACAxGgAot4NQQCKBwCACgcAAACADQAAAEDA/6gN2kGAjcBZ+cANwAn5wAyBAAMAysRIpZQQz8EAxGgAot4/ssUtbUANwKXQIcCNwEHNwEHNwAMAoJVAAIDEdG3ZtQHDBD7A1FFUlJPUl9OT1RfQVVUSE9SSVpFRAwBAgwBAAQDEQUnlSJGOAQAAgMR6tQZlAcMDvsDmUVSUk9SX0VYSVNUSU5HX1BST1BPU0VEX1RYX05PVF9FWFBJUkVEDAECDAEABAMRBSeVIhoKBIYIPoYGCP7Qw2y4AjcC5wBn5wA3AGfnADcALdQCAD8A/tG3ZtQCNwLnAGfnADcAFy8UAgAA/tmowSgANwAHAQKM/uPzPAgCNwE3AucA5wHnACgcAAAA/ueeeeICNwA3AAwCiAIDEfuGrxoPAgAoLAAApwAhAAcMBvsDWUVSUk9SX01BWF9GRUVfRVhDRUVERUQoLAIAXwAhAAcMCvsDbUVSUk9SX01BWF9HQVNQUklDRV9FWENFRURFRAEDP/7q1BmUAjcBNwSXQAdHAGdHADcAFygcAgBZAB8AAP72WF8xADcBNwIHBzcABw6KBPsDlUVSUk9SX0ZFRV9QUk9URUNUSU9OX0FMUkVBRFlfRElTQUJMRUQMAoJVAAIDEdG3ZtQHDAr7A2FFUlJPUl9OT1RfQV9WQUxJRF9TSUdORVIMAQBE/ogjAAICAgEDP/721jLtADcAFwECiv76lKxHAjcChwI3ADcB5wB35wAIPQACBPsBAkY0AAAA/vuGrxoCNwGHAjcANwHnAOcACD0AAgT7A0VGb3JjZWQgTm9uZSB2YWx1ZUY0AAAAuQKeLx4RA/4xvElnZXRfY29uc2Vuc3VzX2luZm8RBSeVIoEuU2ltcGxlR0FNdWx0aVNpZy5zZXRfY3VycmVudF90eBEKU40SGXJldm9rZRELyoiryS5TaW1wbGVHQU11bHRpU2lnLnJlcXVpcmVfdmFsaWRfc2lnbmVyX2FuZF90eF9oYXNoEQwaHXctZ2V0X3ZlcnNpb24REYInH40uU2ltcGxlR0FNdWx0aVNpZy5leHBpcmF0aW9uX2hlaWdodBEillBDGS5eMTI1OBEy8XUJWWRpc2FibGVfZmVlX3Byb3RlY3Rpb24RNr2PAyEuU2V0Lm5ldxFE1kQfEWluaXQRYNkn50lnZXRfZmVlX3Byb3RlY3Rpb24RY1F0bSUuU2V0LnNpemURZaXgDy1DaGFpbi5ldmVudBFs8lcLJWF1dGhvcml6ZRFzF3ZSHWNvbmZpcm0RipJkun0uU2ltcGxlR0FNdWx0aVNpZy5oYXNfY29uc2Vuc3VzEZnlH6otZ2V0X3NpZ25lcnMRoAKLeCUuTGlzdC5tYXARoDdpBjEuU2V0LnRvX2xpc3QRyxS1tR1wcm9wb3NlEdDDbLgtLlNldC5pbnNlcnQR0bdm1C0uU2V0Lm1lbWJlchHZqMEoJWdldF9ub25jZRHj8zwIJS5QYWlyLmZzdBHnnnnifS5TaW1wbGVHQU11bHRpU2lnLnZlcmlmeV90eF9mZWUR6tQZlGUuU2ltcGxlR0FNdWx0aVNpZy5leHBpcmVkEfZYXzFVdXBkYXRlX2ZlZV9wcm90ZWN0aW9uEfbWMu1laXNfZmVlX3Byb3RlY3Rpb25fZW5hYmxlZBH6lKxHRS5PcHRpb24uZm9yY2VfbXNnEfuGrxo1Lk9wdGlvbi5mb3JjZYIvAIU2LjEuMAA1L4Nx';

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
      aci: SimpleGAMultiSigAci,
      bytecode: SimpleGAMultiSigBytecode,
    });
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
          aci: SimpleGAMultiSigAci,
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
  };
}
