<template>
  <TransactionInfo
    class="transaction-overview"
    :title="preparedTransaction.title"
    :sender="preparedTransaction.sender"
    :recipient="preparedTransaction.recipient"
    :transaction-function="preparedTransaction.function"
    :transaction="transaction"
  />
</template>

<script lang="ts">
import { Encoded, Tag } from '@aeternity/aepp-sdk';
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
} from 'vue';
import { TranslateResult, useI18n } from 'vue-i18n';
import { BytecodeContractCallEncoder } from '@aeternity/aepp-calldata';

import type {
  IAccount,
  IAccountOverview,
  ITransaction,
  TxFunction,
} from '@/types';
import { TX_DIRECTION } from '@/constants';
import { TX_FUNCTIONS } from '@/protocols/aeternity/config';
import {
  useAeSdk,
  useMiddleware,
  useTransactionTx,
} from '@/composables';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';

import TransactionInfo from './TransactionInfo.vue';

interface TransactionData {
  sender: IAccountOverview;
  recipient: IAccountOverview;
  title?: TranslateResult;
  function?: TxFunction;
}

export default defineComponent({
  components: {
    TransactionInfo,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, required: true },
  },
  setup(props) {
    const { t, tm } = useI18n();

    const { aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();
    const { getAeSdk } = useAeSdk();
    const { getName } = useAeNames();
    const { getMiddleware } = useMiddleware();

    const name = ref('');
    const ownershipAccount = ref<IAccountOverview | IAccount | {}>({});

    const {
      isDex,
      outerTxTag,
      innerTxTag,
      direction,
      getOwnershipAccount,
      innerTx,
    } = useTransactionTx({
      tx: props.transaction.tx,
      externalAddress: props.transaction?.transactionOwner,
    });

    function getTransactionParty(address: Encoded.AccountAddress): IAccountOverview {
      return {
        address,
        label: t('transaction.overview.accountAddress'),
        url: (new AeScan(aeActiveNetworkPredefinedSettings.value.explorerUrl!))
          .prepareUrlByHash(address),
      };
    }

    const preparedTransaction = computed((): TransactionData => {
      const transactionTypes = tm('transaction.type') as Record<string, TranslateResult>;
      const aeScan = new AeScan(aeActiveNetworkPredefinedSettings.value.explorerUrl!);

      const {
        senderId,
        recipientId,
        contractId,
        callerId,
      } = innerTx.value;

      switch (outerTxTag.value) {
        case Tag.SpendTx:
          return {
            sender: {
              address: senderId,
              name: getName(senderId).value,
              url: aeScan.prepareUrlByHash(senderId),
              label: t('transaction.overview.accountAddress'),
            },
            recipient: {
              address: recipientId,
              name: name.value || getName(recipientId).value,
              url: aeScan.prepareUrlByHash(recipientId),
              label: t('transaction.overview.accountAddress'),
            },
            title: t('transaction.type.spendTx'),
          };
        case Tag.ContractCallTx: {
          const contract: IAccountOverview = {
            address: contractId,
            url: aeScan.prepareUrlByHash(contractId),
            label: isDex.value
              ? t('transaction.overview.superheroDex')
              : t('common.smartContract'),
          };

          let transactionOwner;
          let transactionReceiver = contract;

          if (props.transaction.transactionOwner) {
            transactionOwner = getTransactionParty(props.transaction.transactionOwner);
          }

          if (innerTx.value.function === TX_FUNCTIONS.transfer) {
            const sentRecipientId = recipientId || innerTx.value.arguments?.[0].value;

            transactionReceiver = getTransactionParty(
              direction.value === TX_DIRECTION.received
                ? callerId
                : sentRecipientId,
            );
          }

          return {
            sender: direction.value === TX_DIRECTION.sent
              ? ownershipAccount.value
              : transactionReceiver,
            recipient: direction.value === TX_DIRECTION.received
              ? transactionOwner ?? ownershipAccount.value
              : contract,
            title: t('transaction.type.contractCallTx'),
            function: innerTx.value.function,
          };
        }
        case Tag.ContractCreateTx:
          return {
            sender: ownershipAccount.value,
            recipient: {
              label: t('transaction.overview.contractCreate'),
            },
            title: t('transaction.type.contractCreateTx'),
          };
        case Tag.NamePreclaimTx:
        case Tag.NameClaimTx:
        case Tag.NameUpdateTx:
          return {
            sender: ownershipAccount.value,
            recipient: {
              label: t('transaction.overview.aens'),
            },
            title: outerTxTag.value ? transactionTypes[outerTxTag.value] : undefined,
          };
        case Tag.PayingForTx: {
          return {
            sender: {
              address: innerTx.value.ownerId,
              name: getName(innerTx.value.ownerId).value,
              url: aeScan.prepareUrlByHash(innerTx.value.ownerId),
              label: t('multisig.multisigVault'),
            },
            recipient: {
              label: t('common.smartContract'),
              address: innerTx.value.contractId,
            },
          };
        }
        case Tag.GaMetaTx: {
          if (innerTxTag.value === Tag.SpendTx) {
            return {
              sender: {
                address: senderId,
                name: getName(senderId).value,
                url: aeScan.prepareUrlByHash(senderId),
                label: t('transaction.overview.accountAddress'),
              },
              recipient: {
                address: recipientId,
                name: name.value || getName(recipientId).value,
                url: aeScan.prepareUrlByHash(recipientId),
                label: t('transaction.overview.accountAddress'),
              },
              title: t('transaction.type.spendTx'),
            };
          }
        }
        // eslint-disable-next-line no-fallthrough
        default:
          throw new Error(`Unsupported transaction type ${outerTxTag.value}`);
      }
    });

    async function decodeClaimTransactionAccount(): Promise<Encoded.AccountAddress | undefined> {
      // eslint-disable-next-line camelcase
      const calldata = innerTx.value.callData || innerTx.value.call_data;

      if (!(innerTx.value.contractId && calldata)) return undefined;

      const aeSdk = await getAeSdk();
      const { bytecode } = await aeSdk.getContractByteCode(innerTx.value.contractId);

      const bytecodeContractCallEncoder = new BytecodeContractCallEncoder(bytecode);

      const txParams = bytecodeContractCallEncoder.decodeCall(calldata) as any;
      if (!txParams) return undefined;

      return txParams.args?.[0];
    }

    onMounted(async () => {
      const middleware = await getMiddleware();
      if (innerTx.value.recipientId?.startsWith('nm_')) {
        name.value = (await middleware.getName(innerTx.value.recipientId)).name;
      }
      let transactionOwnerAddress;
      if (innerTx.value.function === TX_FUNCTIONS.claim) {
        transactionOwnerAddress = await decodeClaimTransactionAccount();
      }
      ownershipAccount.value = getOwnershipAccount(transactionOwnerAddress);
    });

    return {
      preparedTransaction,
    };
  },
});
</script>

<style scoped lang="scss">
@use '@/styles/mixins';

.tag-wrapper {
  @include mixins.flex(center, center);

  gap: 8px;
}
</style>
