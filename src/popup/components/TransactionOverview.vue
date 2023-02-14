<template>
  <TransactionInfo
    class="transaction-overview"
    :title="transaction.title"
    :sender="transaction.sender"
    :recipient="transaction.recipient"
    :tx-function="transaction.function"
    :is-incomplete="transaction.incomplete"
    :is-pending="transaction.pending"
    :is-claim="transaction.claim"
    :tx="tx"
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
  TX_FUNCTIONS,
  TX_TYPE_MDW,
  watchUntilTruthy,
} from '../utils';
import { useSdk, useTransactionTx } from '../../composables';
import { useState, useGetter } from '../../composables/vuex';
import {
  IAccount,
  IAccountLabeled,
  IGAAttachTx,
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
    tx: { type: Object as PropType<ITx>, required: true },
  },
  setup(props, { root }) {
    const name = ref('');
    const ownershipAccount = ref<IAccountLabeled | IAccount | {}>({});

    const middleware = useState('middleware');

    const getExplorerPath = useGetter('getExplorerPath');
    const getDexContracts = useGetter('getDexContracts');
    const getPreferred = useGetter('names/getPreferred');

    const { getSdk } = useSdk({ store: root.$store });

    const {
      txType,
      direction,
      getOwnershipAccount,
    } = useTransactionTx({
      store: root.$store,
      tx: props.tx,
    });

    const isDexRecipient = computed(
      () => [
        ...getDexContracts.value.router,
        ...getDexContracts.value.wae,
      ].includes(props.tx?.contractId),
    );

    const transaction = computed((): TransactionData => {
      const transactionTypes = root.$t('transaction.type') as Record<TxType, TranslateResult>;

      const { senderId, recipientId, contractId } = props.tx;

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
            label: root.$t(`transaction.overview.${isDexRecipient.value ? 'superheroDex' : 'contract'}`),
          };

          return {
            sender: direction.value === TX_FUNCTIONS.sent
              ? ownershipAccount.value
              : contract,
            recipient: direction.value === TX_FUNCTIONS.received
              ? ownershipAccount.value
              : contract,
            title: root.$t('transaction.type.contractCallTx'),
            function: props.tx.function,
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
        case TX_TYPE_MDW.PayingForTx: {
          const tx = props.tx.tx?.tx as IGAAttachTx;
          return {
            sender: {
              address: tx.ownerId,
              name: getPreferred.value(tx.ownerId),
              url: getExplorerPath.value(tx.ownerId),
              label: root.$t('multisig.multisigVault'),
            },
            recipient: {
              label: root.$t('transaction.overview.smartContract'),
              address: tx.contractId,
            },
          };
        }
        default:
          throw new Error(`Unsupported transaction type: ${txType.value}`);
      }
    });

    async function decodeClaimTransactionAccount(): Promise<string> {
      // eslint-disable-next-line camelcase
      const calldata = props.tx.callData || props.tx.call_data;

      if (!(props.tx.contractId && calldata)) return '';

      const sdk = await getSdk();
      const { bytecode } = await sdk.getContractByteCode(props.tx.contractId);
      const txParams: ITx = await sdk.compilerApi.decodeCalldataBytecode({
        bytecode,
        calldata,
      });
      if (!txParams) return '';

      return txParams.arguments?.find((param: any) => param.type === 'address')?.value;
    }

    onMounted(async () => {
      await watchUntilTruthy(() => middleware.value);
      if (props.tx.recipientId?.startsWith('nm_')) {
        name.value = (await middleware.value.getNameById(props.tx.recipientId)).name;
      }
      let transactionOwnerAddress;
      if (props.tx.function === TX_FUNCTIONS.claim) {
        transactionOwnerAddress = await decodeClaimTransactionAccount();
      }
      ownershipAccount.value = getOwnershipAccount(transactionOwnerAddress);
    });

    return {
      transaction,
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
