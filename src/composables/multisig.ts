import { ref } from '@vue/composition-api';
import type { Store } from 'vuex';
import multisigContract from '@aeternity/ga-multisig-contract/SimpleGAMultiSig.aes';
import { Crypto } from '@aeternity/aepp-sdk';
import type { IMultisigAccount, IMultisigCreationStep } from '../types';
import { useSdk } from './sdk';
import { MULTISIG_CREATION_STEPS } from '../popup/utils';

interface UseMultisigOptions {
  /**
   * TODO: Temporary solution to avoid dependency circle
   */
  store: Store<any>
}

/**
 * This composable provides methods related to multisig operations
 */
export function useMultisig({ store }: UseMultisigOptions) {
  const { getDrySdk, getSdk } = useSdk({ store });

  const multisigProgress = ref<IMultisigCreationStep>(MULTISIG_CREATION_STEPS.preparing);

  /**
   * @param {number} noOfConfirmations no of minimum confirmation needed to process a transaction
   * @param {string[]} signers
   */
  async function deployMultisigAccount(
    noOfConfirmations: number,
    signersAddesses: [string, string, ...string[]],
  ): Promise<IMultisigAccount> {
    if (noOfConfirmations > signersAddesses.length) throw Error('Number of confirmations exceed amount of signers');
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

    const contractArgs = [noOfConfirmations, signersAddesses];
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
      gaContractId: gaContract.contractId,
      gaAccountId: gaAccount.publicKey,
    };
  }

  return {
    multisigProgress,
    deployMultisigAccount,
  };
}
