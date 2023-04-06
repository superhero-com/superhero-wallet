import { computed, ref } from 'vue';
import BigNumber from 'bignumber.js';
import { AmountFormatter, Crypto, TxBuilder } from '@aeternity/aepp-sdk';
import dayjs from 'dayjs';
import type {
  IDefaultComposableOptions,
  IKeyPair,
  IMultisigAccount,
  IMultisigCreationPhase,
  IRawMultisigAccount,
} from '../types';
import { useSdk } from './sdk';
import {
  DEFAULT_WAITING_HEIGHT,
  MULTISIG_CREATION_PHASES,
  MULTISIG_SIMPLE_GA_BYTECODE,
  SUPPORTED_MULTISIG_CONTRACT_VERSION,
} from '../popup/utils';
import SimpleGAMultiSigAci from '../lib/contracts/SimpleGAMultiSigACI.json';
import { useMultisigAccounts } from './multisigAccounts';
import { useBalances } from './balances';

const pendingMultisigCreationTxs = ref<Record<string, IRawMultisigAccount>>({});
const multisigAccountCreationPhase = ref<IMultisigCreationPhase>(null);
const notEnoughBalanceToCreateMultisig = ref<boolean>(false);

export function useMultisigAccountCreate({ store }: IDefaultComposableOptions) {
  const { getDrySdk, getSdk } = useSdk({ store });
  const {
    getMultisigAccountByContractId,
    addPendingMultisigAccount,
  } = useMultisigAccounts({ store, pollOnce: true });
  const { balances } = useBalances({ store });

  const multisigAccount = ref<IMultisigAccount | null>(null);
  const multisigAccountCreationFee = ref<number>(0);

  const isMultisigAccountAccessible = computed(() => (
    multisigAccount.value
    && multisigAccountCreationPhase.value === MULTISIG_CREATION_PHASES.accessible
  ));

  const isMultisigAccountCreated = computed(() => (
    multisigAccount.value
    && multisigAccountCreationPhase.value === MULTISIG_CREATION_PHASES.created
  ));

  async function createMultisigContractInstance() {
    const drySdk = await getDrySdk();
    return drySdk.getContractInstance({
      aci: SimpleGAMultiSigAci,
      bytecode: MULTISIG_SIMPLE_GA_BYTECODE,
    });
  }

  /**
   * Estimate the amount of AE tokens to be paid for the multisig account creation.
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
  async function prepareVaultCreationAttachTx(
    noOfConfirmations: number,
    signersAddresses: string[],
  ) {
    if (noOfConfirmations > signersAddresses.length) throw Error('Number of confirmations exceed amount of signers');

    const contractArgs = [noOfConfirmations, signersAddresses];
    const drySdk = await getDrySdk();

    // Create a temporary account
    const gaAccount: IKeyPair = Crypto.generateKeyPair();
    pendingMultisigCreationTxs.value[gaAccount.publicKey] = {};
    const multisigContractInstance = await createMultisigContractInstance();
    pendingMultisigCreationTxs.value[gaAccount.publicKey]
      .multisigAccountCreationEncodedCallData = multisigContractInstance.calldata.encode(
        multisigContractInstance._name,
        'init',
        contractArgs,
      );

    // Build Attach transaction
    const attachTX = await drySdk.gaAttachTx({
      ownerId: gaAccount.publicKey,
      code: multisigContractInstance.bytecode,
      callData: pendingMultisigCreationTxs.value[gaAccount.publicKey]
        .multisigAccountCreationEncodedCallData,
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
    pendingMultisigCreationTxs.value[gaAccount.publicKey]
      .signedAttachTx = await drySdk.signTransaction(attachTX.tx, {
        innerTx: true,
        onAccount: gaAccount,
      });
    multisigAccountCreationPhase.value = MULTISIG_CREATION_PHASES.prepared;
    return gaAccount.publicKey;
  }

  /**
   * First step of creating the multisig account
   * Prepare multisig account creation transaction
   */
  async function prepareVaultCreationRawTx(payerId: string, accountId: string) {
    if (!pendingMultisigCreationTxs.value[accountId]?.signedAttachTx) {
      throw Error(`GA Attach Tx not found for account ${accountId}, Prepare attach transaction first`);
    }

    const sdk = await getSdk();

    // Wrap signed GA attach transaction
    const opt = {
      ...sdk.Ae.defaults,
      ...{
        waitMined: true,
        modal: false,
        innerTx: true,
        fromAccount: payerId,
      },
    };
    const payedTx = await sdk.send(
      await sdk.payingForTx({
        ...opt,
        payerId,
        tx: pendingMultisigCreationTxs.value[accountId].signedAttachTx,
      }),
      opt,
    );
    pendingMultisigCreationTxs.value[accountId].rawTx = payedTx.rawTx;

    // Calculate fee
    const { tx } = TxBuilder.unpackTx(payedTx.rawTx);
    const outerFee = tx.encodedTx.tx.fee;
    const innerFee = tx.encodedTx.tx.tx.tx.encodedTx.tx.fee;
    const creationFeeUnformatted = new BigNumber(outerFee).plus(innerFee).toFixed();
    multisigAccountCreationFee.value = Number(AmountFormatter.toAe(creationFeeUnformatted));
    multisigAccountCreationPhase.value = MULTISIG_CREATION_PHASES.signed;
    notEnoughBalanceToCreateMultisig.value = (
      balances.value[payerId]?.isLessThan(multisigAccountCreationFee.value)
    );
  }

  /**
   * Second step of account creation.
   * @throws Error
   */
  async function deployMultisigAccount(
    accountId: string,
    confirmationsRequired: number,
    signers: string[],
  ) {
    if (!pendingMultisigCreationTxs.value[accountId]?.signedAttachTx) {
      throw Error(`Raw PayForTransaction not found for account ${accountId}, Prepare PayForTransaction first`);
    }

    const sdk = await getSdk();

    // Send transaction to the chain
    const { txHash } = await sdk.api.postTransaction(
      { tx: pendingMultisigCreationTxs.value[accountId].rawTx },
    );
    const pollingResponse = await sdk.poll(txHash, { blocks: DEFAULT_WAITING_HEIGHT });
    if (pollingResponse && pollingResponse.blockHeight !== -1) {
      multisigAccountCreationPhase.value = MULTISIG_CREATION_PHASES.deployed;
      const gaContract = await sdk.getAccount(accountId);
      multisigAccountCreationPhase.value = MULTISIG_CREATION_PHASES.created;

      const currentDate = dayjs().toISOString();

      multisigAccount.value = {
        contractId: gaContract.contractId,
        balance: new BigNumber(gaContract.balance),
        gaAccountId: accountId,
        signers,
        confirmationsRequired,
        nonce: 1, // Default value for freshly created account
        createdAt: currentDate,
        updatedAt: currentDate,
        hasPendingTransaction: false,
        confirmedBy: [],
        expired: false,
        id: 0,
        proposedBy: '',
        refusedBy: [],
        txHash: undefined, // set from propose
        version: SUPPORTED_MULTISIG_CONTRACT_VERSION,
        expirationHeight: 0,
        signerId: signers[0],
        height: -1,
        pending: true,
      };

      delete pendingMultisigCreationTxs.value[accountId];
    } else {
      throw Error('Vault creation transaction is not mined within the expected time');
    }

    addPendingMultisigAccount(multisigAccount.value);

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
    pendingMultisigCreationTxs,
    multisigAccountCreationFee,
    isMultisigAccountAccessible,
    isMultisigAccountCreated,
    prepareVaultCreationAttachTx,
    prepareVaultCreationRawTx,
    deployMultisigAccount,
    notEnoughBalanceToCreateMultisig,
  };
}
