<template>
  <TransactionInfo
    class="transaction-overview"
    :title="preparedTransaction.title"
    :sender="preparedTransaction.sender"
    :recipient="preparedTransaction.recipient"
    :transaction-function="preparedTransaction.function"
    :transaction="transaction"
    :additional-tag="additionalTag"
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
  AccountAddress,
  IAccountOverview,
  ITransaction,
  TxFunction,
} from '@/types';
import { PROTOCOLS, TX_DIRECTION } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useAeSdk, useTransactionData } from '@/composables';

import type { AeDecodedCallData } from '@/protocols/aeternity/types';
import { TX_FUNCTIONS } from '@/protocols/aeternity/config';
import { useAeMiddleware } from '@/protocols/aeternity/composables';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';

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
    additionalTag: { type: String, default: null },
  },
  setup(props) {
    const { t, tm } = useI18n();

    const { getAeSdk } = useAeSdk();
    const { getName } = useAeNames();
    const { getMiddleware } = useAeMiddleware();

    const name = ref('');
    const ownershipAccount = ref<IAccountOverview | {}>({});

    const adapter = ProtocolAdapterFactory.getAdapter(
      props.transaction.protocol
      || PROTOCOLS.aeternity,
    );
    const protocolExplorer = adapter.getExplorer();

    const {
      isDex,
      outerTxTag,
      innerTxTag,
      direction,
      getOwnershipAddress,
      innerTx,
    } = useTransactionData({
      transaction: props.transaction,
      externalAddress: props.transaction?.transactionOwner,
    });

    function getTransactionParty(address: AccountAddress): IAccountOverview {
      return {
        address,
        label: t('transaction.overview.accountAddress'),
        url: protocolExplorer.prepareUrlForAccount(address),
      };
    }

    const preparedTransaction = computed((): TransactionData => {
      const transactionTypes = tm('transaction.type') as Record<string, TranslateResult>;

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
              url: protocolExplorer.prepareUrlForAccount(senderId),
              label: t('transaction.overview.accountAddress'),
            },
            recipient: {
              address: recipientId,
              name: name.value || getName(recipientId).value,
              url: protocolExplorer.prepareUrlForAccount(recipientId),
              label: t('transaction.overview.accountAddress'),
            },
            title: t('transaction.type.spendTx'),
          };
        case Tag.ContractCallTx: {
          const contract: IAccountOverview = {
            address: contractId,
            url: protocolExplorer.prepareUrlForHash(contractId),
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
              url: protocolExplorer.prepareUrlForAccount(innerTx.value.ownerId),
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
                url: protocolExplorer.prepareUrlForAccount(senderId),
                label: t('transaction.overview.accountAddress'),
              },
              recipient: {
                address: recipientId,
                name: name.value || getName(recipientId).value,
                url: protocolExplorer.prepareUrlForAccount(recipientId),
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

      const txParams = bytecodeContractCallEncoder.decodeCall(calldata) as AeDecodedCallData;
      if (!txParams) return undefined;

      return txParams.args?.[0] as Encoded.AccountAddress;
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
      const ownerAddress = getOwnershipAddress(transactionOwnerAddress);
      ownershipAccount.value = {
        address: ownerAddress,
        name: getName(ownerAddress as Encoded.AccountAddress).value,
        label: t('transaction.overview.accountAddress'),
        url: protocolExplorer.prepareUrlForAccount(ownerAddress as Encoded.AccountAddress),
      };
    });

    return {
      preparedTransaction,
    };
  },
});
</script>
