import { computed, ref } from '@vue/composition-api';
import BigNumber from 'bignumber.js';
import { AmountFormatter, Crypto, TxBuilder } from '@aeternity/aepp-sdk';
import type {
  IDefaultComposableOptions,
  IKeyPair,
  IMultisigAccountBase,
  IMultisigCreationPhase,
} from '../types';
import { useSdk } from './sdk';
import { MULTISIG_CREATION_PHASES, MULTISIG_SIMPLE_GA_BYTECODE } from '../popup/utils';
import SimpleGAMultiSigAci from '../lib/contracts/SimpleGAMultiSigACI.json';
import { useMultisigAccounts } from './multisigAccounts';

export function useMultisigAccountCreate({ store }: IDefaultComposableOptions) {
  const { getDrySdk, getSdk } = useSdk({ store });
  const { getMultisigAccountByContractId } = useMultisigAccounts({ store });

  let rawTx: string;
  let accountId: string;

  const multisigAccount = ref<IMultisigAccountBase | null>(null);
  const multisigAccountCreationPhase = ref<IMultisigCreationPhase>(null);
  const multisigAccountCreationEncodedCallData = ref<string>();
  const multisigAccountCreationFee = ref<number>(0);

  const isMultisigAccountAccessible = computed(() => (
    multisigAccount.value
    && multisigAccountCreationPhase.value === MULTISIG_CREATION_PHASES.accessible
  ));

  async function createMultisigContractInstance() {
    const drySdk = await getDrySdk();
    return drySdk.getContractInstance({
      aci: SimpleGAMultiSigAci,
      bytecode: MULTISIG_SIMPLE_GA_BYTECODE,
    });
  }

  /**
   * Estimate the amount of AE tokens to be payed for the multisig account creation.
   */
  async function estimateMultisigAccountDeployGasFee(
    multisigContractInstance: any,
    noOfConfirmations: number,
    signersAddresses: string[],
  ): Promise<number> {
    return (multisigContractInstance || await createMultisigContractInstance())
      ._estimateGas('init', [noOfConfirmations, signersAddresses]);
  }

  /**
   * First step of creating the multisig account
   * Prepare multisig account creation transaction
   */
  async function multisigAccountPrepare(
    noOfConfirmations: number,
    signersAddresses: string[],
  ) {
    if (noOfConfirmations > signersAddresses.length) throw Error('Number of confirmations exceed amount of signers');

    const contractArgs = [noOfConfirmations, signersAddresses];
    const [sdk, drySdk] = await Promise.all([getSdk(), getDrySdk()]);

    // Create a temporary account
    const gaAccount: IKeyPair = Crypto.generateKeyPair();

    const multisigContractInstance = await createMultisigContractInstance();
    multisigAccountCreationPhase.value = MULTISIG_CREATION_PHASES.prepared;
    multisigAccountCreationEncodedCallData.value = multisigContractInstance.calldata.encode(
      multisigContractInstance._name,
      'init',
      contractArgs,
    );

    // Build Attach transaction
    const attachTX = await drySdk.gaAttachTx({
      ownerId: gaAccount.publicKey,
      code: multisigContractInstance.bytecode,
      callData: multisigAccountCreationEncodedCallData.value,
      authFun: Crypto.hash('authorize'),
      gas: await estimateMultisigAccountDeployGasFee(
        multisigContractInstance,
        noOfConfirmations,
        signersAddresses,
      ),
      options: {
        innerTx: true,
      },
    });

    const signedAttachTx = await drySdk.signTransaction(attachTX.tx, {
      innerTx: true,
      onAccount: gaAccount,
    });

    // Wrap signed GA attach transaction
    const payedTx = await sdk.payForTransaction(signedAttachTx, {
      waitMined: true,
      modal: false,
      innerTx: true,
    });

    rawTx = payedTx.rawTx;
    accountId = gaAccount.publicKey;

    // Calculate fee
    const { tx } = TxBuilder.unpackTx(rawTx);
    const outerFee = tx.encodedTx.tx.fee;
    const innerFee = tx.encodedTx.tx.tx.tx.encodedTx.tx.fee;
    const creationFeeUnformatted = new BigNumber(outerFee).plus(innerFee).toFixed();
    multisigAccountCreationFee.value = Number(AmountFormatter.toAe(creationFeeUnformatted));
  }

  /**
   * Second step of account creation.
   * @throws Error
   */
  async function multisigAccountCreate() {
    if (multisigAccountCreationPhase.value !== MULTISIG_CREATION_PHASES.prepared) {
      throw new Error('To create new multisig vault the account should be prepared first.');
    }

    const sdk = await getSdk();

    // Send transaction to the chain
    const { txHash } = await sdk.api.postTransaction(
      { tx: rawTx },
    );
    await sdk.poll(txHash);
    multisigAccountCreationPhase.value = MULTISIG_CREATION_PHASES.deployed;

    const gaContract = await sdk.getAccount(accountId);
    multisigAccountCreationPhase.value = MULTISIG_CREATION_PHASES.created;
    multisigAccount.value = {
      contractId: gaContract.contractId,
      multisigAccountId: accountId,
    };

    // Wait for the account to be discovered by the wallet to allow to open it's details.
    // TODO in the future we could try to add the new account to the list of the accounts.
    await new Promise((resolve) => {
      const interval = setInterval(() => {
        if (
          multisigAccount.value?.contractId
          && getMultisigAccountByContractId(multisigAccount.value.contractId)
        ) {
          multisigAccountCreationPhase.value = MULTISIG_CREATION_PHASES.accessible;
          resolve(true);
          clearInterval(interval);
        }
      }, 1000);
    });
  }

  return {
    multisigAccount,
    multisigAccountCreationPhase,
    multisigAccountCreationEncodedCallData,
    multisigAccountCreationFee,
    isMultisigAccountAccessible,
    multisigAccountPrepare,
    multisigAccountCreate,
  };
}
