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
import { SCHEMA } from '@aeternity/aepp-sdk';
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
} from '@vue/composition-api';
import { TranslateResult } from 'vue-i18n';
import {
  postJson,
  TX_DIRECTION,
  TX_FUNCTIONS,
  TX_TYPE_MDW,
} from '../utils';
import { useMiddleware, useSdk, useTransactionTx } from '../../composables';
import { useGetter } from '../../composables/vuex';
import {
  IAccount,
  IAccountLabeled,
  ITransaction,
  ITx,
  TxType,
  TxFunction,
} from '../../types';
import TransactionInfo from './TransactionInfo.vue';

interface TransactionData {
  sender: IAccountLabeled
  recipient: IAccountLabeled
  title?: TranslateResult
  function?: TxFunction
}

export default defineComponent({
  components: { TransactionInfo },
  props: {
    transaction: { type: Object as PropType<ITransaction>, required: true },
  },
  setup(props, { root }) {
    const name = ref('');
    const ownershipAccount = ref<IAccountLabeled | IAccount | {}>({});

    const getExplorerPath = useGetter('getExplorerPath');
    const activeNetwork = useGetter('activeNetwork');
    const getPreferred = useGetter('names/getPreferred');

    const { getSdk } = useSdk({ store: root.$store });
    const { getMiddleware } = useMiddleware({ store: root.$store });

    const {
      isDex,
      txType,
      direction,
      getOwnershipAccount,
      innerTx,
    } = useTransactionTx({
      store: root.$store,
      tx: props.transaction.tx,
      externalAddress: props.transaction?.transactionOwner,
    });

    function getTransactionParty(address: string) {
      return {
        address,
        label: root.$t('transaction.overview.accountAddress'),
        url: getExplorerPath.value(address),
      };
    }

    const preparedTransaction = computed((): TransactionData => {
      const transactionTypes = root.$t('transaction.type') as Record<TxType, TranslateResult>;

      const {
        senderId,
        recipientId,
        contractId,
        callerId,
      } = innerTx.value;

      switch (txType.value) {
        case SCHEMA.TX_TYPE.spend:
          return {
            sender: {
              address: senderId,
              name: getPreferred.value(senderId),
              url: getExplorerPath.value(senderId),
              label: root.$t('transaction.overview.accountAddress'),
            },
            recipient: {
              address: recipientId,
              name: name.value || getPreferred.value(recipientId),
              url: getExplorerPath.value(recipientId),
              label: root.$t('transaction.overview.accountAddress'),
            },
            title: root.$t('transaction.type.spendTx'),
          };
        case SCHEMA.TX_TYPE.contractCall: {
          const contract = {
            address: contractId,
            url: getExplorerPath.value(contractId),
            label: root.$t(`transaction.overview.${isDex.value ? 'superheroDex' : 'contract'}`),
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
              : transactionReceiver,
            title: root.$t('transaction.type.contractCallTx'),
            function: innerTx.value.function,
          };
        }
        case SCHEMA.TX_TYPE.contractCreate:
          return {
            sender: ownershipAccount.value,
            recipient: {
              label: root.$t('transaction.overview.contractCreate'),
            },
            title: root.$t('transaction.type.contractCreateTx'),
          };
        case SCHEMA.TX_TYPE.namePreClaim:
        case SCHEMA.TX_TYPE.nameClaim:
        case SCHEMA.TX_TYPE.nameBid:
        case SCHEMA.TX_TYPE.nameUpdate:
          return {
            sender: ownershipAccount.value,
            recipient: {
              label: root.$t('transaction.overview.aens'),
            },
            title: txType.value ? transactionTypes[txType.value] : undefined,
          };
        case TX_TYPE_MDW.GAAttachTx: {
          return {
            sender: {
              address: innerTx.value.ownerId,
              name: getPreferred.value(innerTx.value.ownerId),
              url: getExplorerPath.value(innerTx.value.ownerId),
              label: root.$t('multisig.multisigVault'),
            },
            recipient: {
              label: root.$t('transaction.overview.smartContract'),
              address: innerTx.value.contractId,
            },
          };
        }
        default:
          throw new Error(`Unsupported transaction type ${txType.value}`);
      }
    });

    async function decodeClaimTransactionAccount(): Promise<string> {
      // eslint-disable-next-line camelcase
      const calldata = innerTx.value.callData || innerTx.value.call_data;

      if (!(innerTx.value.contractId && calldata)) return '';

      const sdk = await getSdk();
      const { bytecode } = await sdk.getContractByteCode(innerTx.value.contractId);
      // TODO: use sdk method on sdk 13 update
      const txParams: ITx = await postJson(
        `${activeNetwork.value.compilerUrl}/decode-calldata/bytecode`,
        { body: { bytecode, calldata } },
      );
      if (!txParams) return '';

      return txParams.arguments?.find((param: any) => param.type === 'address')?.value;
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
@use '../../styles/mixins';

.tag-wrapper {
  @include mixins.flex(center, center);

  gap: 8px;
}
</style>
