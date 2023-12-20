import { computed, ref } from 'vue';
import BigNumber from 'bignumber.js';
import {
  Encoded,
  MemoryAccount,
  Tag,
  generateKeyPair,
  hash,
  unpackTx,
} from '@aeternity/aepp-sdk';
import dayjs from 'dayjs';

import type {
  IMultisigAccount,
  IMultisigCreationPhase,
  IRawMultisigAccount,
} from '@/types';
import { DEFAULT_WAITING_HEIGHT } from '@/constants';
import {
  MULTISIG_CREATION_PHASES,
  MULTISIG_SIMPLE_GA_BYTECODE,
  MULTISIG_SUPPORTED_CONTRACT_VERSION,
} from '@/protocols/aeternity/config';
import {
  aettosToAe,
} from '@/protocols/aeternity/helpers';
import SimpleGAMultiSigAci from '@/protocols/aeternity/aci/SimpleGAMultiSigACI.json';

import { useAeSdk } from './aeSdk';
import { useMultisigAccounts } from './multisigAccounts';
import { useBalances } from './balances';

const pendingMultisigCreationTxs = ref<Record<string, IRawMultisigAccount>>({});
const multisigAccountCreationPhase = ref<IMultisigCreationPhase>(null);
const notEnoughBalanceToCreateMultisig = ref<boolean>(false);

export function useMultisigAccountCreate() {
  const { getDryAeSdk, getAeSdk } = useAeSdk();
  const {
    getMultisigAccountByContractId,
    addPendingMultisigAccount,
  } = useMultisigAccounts({ pollOnce: true });
  const { balances } = useBalances();

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
    const dryAeSdk = await getDryAeSdk();
    return dryAeSdk.initializeContract({
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
    signersAddresses: Encoded.AccountAddress[],
    senderId: Encoded.AccountAddress,
  ): Promise<number> {
    return (multisigContractInstance || await createMultisigContractInstance())
      ._estimateGas('init', [noOfConfirmations, signersAddresses], { senderId });
  }

  /**
   * First step of creating the multisig account
   * Prepare multisig account creation transaction
   */
  async function prepareVaultCreationAttachTx(
    noOfConfirmations: number,
    signersAddresses: Encoded.AccountAddress[],
  ) {
    if (noOfConfirmations > signersAddresses.length) throw Error('Number of confirmations exceed amount of signers');

    const contractArgs = [noOfConfirmations, signersAddresses];
    const dryAeSdk = await getDryAeSdk();

    // Create a temporary account
    const gaAccount = generateKeyPair();
    pendingMultisigCreationTxs.value[gaAccount.publicKey] = {};
    const multisigContractInstance = await createMultisigContractInstance();
    pendingMultisigCreationTxs.value[gaAccount.publicKey]
      .multisigAccountCreationEncodedCallData = multisigContractInstance._calldata.encode(
        multisigContractInstance._name,
        'init',
        contractArgs,
      );

    // Build Attach transaction
    const attachTX = await dryAeSdk.buildTx({
      ownerId: gaAccount.publicKey,
      code: multisigContractInstance.$options.bytecode!,
      callData: pendingMultisigCreationTxs.value[gaAccount.publicKey]
        .multisigAccountCreationEncodedCallData!,
      authFun: hash('authorize'),
      tag: Tag.GaAttachTx,
      gasLimit: await estimateMultisigAccountDeployGasFee(
        multisigContractInstance,
        noOfConfirmations,
        signersAddresses,
        gaAccount.publicKey,
      ),
      nonce: 1,
    });
    pendingMultisigCreationTxs.value[gaAccount.publicKey]
      .signedAttachTx = await dryAeSdk.signTransaction(attachTX, {
        innerTx: true,
        onAccount: new MemoryAccount(gaAccount.secretKey),
      });
    multisigAccountCreationPhase.value = MULTISIG_CREATION_PHASES.prepared;
    return gaAccount.publicKey;
  }

  /**
   * First step of creating the multisig account
   * Prepare multisig account creation transaction
   */
  async function prepareVaultCreationRawTx(
    payerId: Encoded.AccountAddress,
    accountId: Encoded.AccountAddress,
  ) {
    const { signedAttachTx } = pendingMultisigCreationTxs.value[accountId];
    if (!signedAttachTx) {
      throw Error(`GA Attach Tx not found for account ${accountId}, Prepare attach transaction first`);
    }

    const aeSdk = await getAeSdk();
    const payedTx = await aeSdk.signTransaction(
      await aeSdk.buildTx({
        tag: Tag.PayingForTx,
        payerId,
        tx: signedAttachTx,
      }),
      {
        fromAccount: payerId,
      } as any,
    );

    pendingMultisigCreationTxs.value[accountId].rawTx = payedTx;

    // Calculate fee
    const tx = unpackTx(payedTx, Tag.SignedTx);
    if (tx.encodedTx.tag !== Tag.PayingForTx || tx.encodedTx.tx.encodedTx.tag !== Tag.GaAttachTx) {
      throw Error('Transaction build failed');
    }
    const outerFee = tx.encodedTx.fee;
    const innerFee = tx.encodedTx.tx.encodedTx.fee;
    const creationFeeUnformatted = new BigNumber(outerFee).plus(innerFee).toFixed();
    multisigAccountCreationFee.value = +aettosToAe(creationFeeUnformatted);
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
    accountId: Encoded.AccountAddress,
    confirmationsRequired: number,
    signers: Encoded.AccountAddress[],
  ) {
    const { rawTx } = pendingMultisigCreationTxs.value[accountId];
    if (!rawTx) {
      throw Error(`Raw PayForTransaction not found for account ${accountId}, Prepare PayForTransaction first`);
    }

    const aeSdk = await getAeSdk();

    // Send transaction to the chain
    const { txHash } = await aeSdk.api.postTransaction({ tx: rawTx });
    const pollingResponse = await aeSdk.poll(txHash, { blocks: DEFAULT_WAITING_HEIGHT });
    if (pollingResponse && pollingResponse.blockHeight !== -1) {
      multisigAccountCreationPhase.value = MULTISIG_CREATION_PHASES.deployed;
      const gaContract = await aeSdk.getAccount(accountId);
      multisigAccountCreationPhase.value = MULTISIG_CREATION_PHASES.created;

      const currentDate = dayjs().toISOString();

      multisigAccount.value = {
        contractId: gaContract.contractId as Encoded.ContractAddress,
        balance: new BigNumber(gaContract.balance.toString()),
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
        proposedBy: '' as any,
        refusedBy: [],
        txHash: undefined, // set from propose
        version: MULTISIG_SUPPORTED_CONTRACT_VERSION,
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
