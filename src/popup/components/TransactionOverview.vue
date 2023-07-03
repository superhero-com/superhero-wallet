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
import { Encoded } from '@aeternity/aepp-sdk-13';
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
} from 'vue';
import { TranslateResult, useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import {
  postJson,
  TX_DIRECTION,
  TX_FUNCTIONS,
  TX_TYPE_MDW,
} from '../utils';
import { AeScan } from '../../lib/AeScan';
import { useMiddleware, useSdk, useTransactionTx } from '../../composables';
import { useGetter } from '../../composables/vuex';
import {
  IAccount,
  IAccountOverview,
  ITransaction,
  ITx,
  TxType,
  TxFunction,
  INetwork,
} from '../../types';
import TransactionInfo from './TransactionInfo.vue';

interface TransactionData {
  sender: IAccountOverview
  recipient: IAccountOverview
  title?: TranslateResult
  function?: TxFunction
}

export default defineComponent({
  components: { TransactionInfo },
  props: {
    transaction: { type: Object as PropType<ITransaction>, required: true },
  },
  setup(props) {
    const store = useStore();
    const { t, tm } = useI18n();

    const name = ref('');
    const ownershipAccount = ref<IAccountOverview | IAccount | {}>({});

    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const getPreferredName = useGetter('names/getPreferred');

    const { getSdk } = useSdk({ store });
    const { getMiddleware } = useMiddleware({ store });

    const {
      isDex,
      txType,
      direction,
      getOwnershipAccount,
      innerTx,
    } = useTransactionTx({
      store,
      tx: props.transaction.tx,
      externalAddress: props.transaction?.transactionOwner,
    });

    function getTransactionParty(address: string): IAccountOverview {
      const aeScan = new AeScan(activeNetwork.value.explorerUrl);
      return {
        address,
        label: t('transaction.overview.accountAddress'),
        url: aeScan.prepareUrlByHash(address),
      };
    }

    const preparedTransaction = computed((): TransactionData => {
      const transactionTypes = tm('transaction.type') as unknown as Record<TxType, TranslateResult>;
      const aeScan = new AeScan(activeNetwork.value.explorerUrl);

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
              name: getPreferredName.value(senderId),
              url: aeScan.prepareUrlByHash(senderId),
              label: t('transaction.overview.accountAddress'),
            },
            recipient: {
              address: recipientId,
              name: name.value || getPreferredName.value(recipientId),
              url: aeScan.prepareUrlByHash(recipientId),
              label: t('transaction.overview.accountAddress'),
            },
            title: t('transaction.type.spendTx'),
          };
        case SCHEMA.TX_TYPE.contractCall: {
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
        case SCHEMA.TX_TYPE.contractCreate:
          return {
            sender: ownershipAccount.value,
            recipient: {
              label: t('transaction.overview.contractCreate'),
            },
            title: t('transaction.type.contractCreateTx'),
          };
        case SCHEMA.TX_TYPE.namePreClaim:
        case SCHEMA.TX_TYPE.nameClaim:
        case SCHEMA.TX_TYPE.nameBid:
        case SCHEMA.TX_TYPE.nameUpdate:
          return {
            sender: ownershipAccount.value,
            recipient: {
              label: t('transaction.overview.aens'),
            },
            title: txType.value ? transactionTypes[txType.value] : undefined,
          };
        case TX_TYPE_MDW.GAAttachTx: {
          return {
            sender: {
              address: innerTx.value.ownerId,
              name: getPreferredName.value(innerTx.value.ownerId),
              url: aeScan.prepareUrlByHash(innerTx.value.ownerId),
              label: t('multisig.multisigVault'),
            },
            recipient: {
              label: t('common.smartContract'),
              address: innerTx.value.contractId,
            },
          };
        }
        default:
          throw new Error(`Unsupported transaction type ${txType.value}`);
      }
    });

    async function decodeClaimTransactionAccount(): Promise<Encoded.AccountAddress | undefined> {
      // eslint-disable-next-line camelcase
      const calldata = innerTx.value.callData || innerTx.value.call_data;

      if (!(innerTx.value.contractId && calldata)) return undefined;

      const sdk = await getSdk();
      const { bytecode } = await sdk.getContractByteCode(innerTx.value.contractId);
      // TODO: use sdk method on sdk 13 update
      const txParams: ITx = await postJson(
        `${activeNetwork.value.compilerUrl}/decode-calldata/bytecode`,
        { body: { bytecode, calldata } },
      );
      if (!txParams) return undefined;

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
