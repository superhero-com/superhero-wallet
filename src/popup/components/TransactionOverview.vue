<template>
  <TransactionInfo
    class="transaction-overview"
    :sender="transactionParties.sender"
    :recipient="transactionParties.recipient"
    :transaction="transaction"
    :additional-tag="additionalTag"
  />
</template>

<script lang="ts">
import { Tag } from '@aeternity/aepp-sdk';
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
  toRef,
} from 'vue';
import { useI18n } from 'vue-i18n';

import type {
  AccountAddress,
  IAccountOverview,
  ITransaction,
} from '@/types';
import { PROTOCOLS, TX_DIRECTION } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useTransactionData } from '@/composables';
import { isEvm } from '@/utils';

import { TX_FUNCTIONS } from '@/protocols/aeternity/config';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';

import TransactionInfo from './TransactionInfo.vue';

export default defineComponent({
  components: {
    TransactionInfo,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, required: true },
    additionalTag: { type: String, default: null },
  },
  setup(props) {
    const { t } = useI18n();

    const { getName, getNameByNameHash } = useAeNames();

    const name = ref('');
    const protocol = computed(() => props.transaction.protocol || PROTOCOLS.aeternity);
    const adapter = ProtocolAdapterFactory.getAdapter(protocol.value);
    const protocolExplorer = adapter.getExplorer();

    const {
      isDex,
      innerTx,
      innerTxTag,
      outerTxTag,
      direction,
    } = useTransactionData({
      transaction: toRef(() => props.transaction),
    });

    function getTransactionParty(address: AccountAddress): IAccountOverview {
      return {
        address,
        name: protocol.value === PROTOCOLS.aeternity ? (name.value || getName(address).value) : '',
        label: t('transaction.overview.accountAddress'),
        url: protocolExplorer.prepareUrlForAccount(address),
      };
    }

    const transactionParties = computed((): {
      sender: IAccountOverview;
      recipient: IAccountOverview;
    } => {
      const {
        senderId,
        recipientId,
        contractId,
        callerId,
      } = innerTx.value;

      // Handle Aeternity-specific transaction types
      if (protocol.value === PROTOCOLS.aeternity) {
        if (outerTxTag.value === Tag.PayingForTx && innerTxTag.value === Tag.GaAttachTx) {
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

        if (outerTxTag.value === Tag.GaMetaTx) {
          return {
            sender: {
              address: innerTx.value.gaId,
              name: getName(innerTx.value.gaId).value,
              url: protocolExplorer.prepareUrlForAccount(innerTx.value.gaId),
              label: t('multisig.multisigVault'),
            },
            recipient: {
              address: recipientId,
              name: name.value || getName(recipientId).value,
              url: protocolExplorer.prepareUrlForAccount(recipientId),
              label: t('transaction.overview.accountAddress'),
            },
          };
        }

        if (outerTxTag.value === Tag.SpendTx) {
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
          };
        }

        if (outerTxTag.value === Tag.ContractCallTx) {
          const contract: IAccountOverview = {
            address: contractId,
            url: protocolExplorer.prepareUrlForHash(contractId),
            label: (isDex.value && protocol.value === PROTOCOLS.aeternity)
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
              ? {
                address: senderId,
                name: getName(senderId).value,
                url: protocolExplorer.prepareUrlForAccount(senderId),
                label: t('transaction.overview.accountAddress'),
              }
              : transactionReceiver,
            recipient: direction.value === TX_DIRECTION.received
              ? transactionOwner ?? {
                address: senderId,
                name: getName(senderId).value,
                url: protocolExplorer.prepareUrlForAccount(senderId),
                label: t('transaction.overview.accountAddress'),
              }
              : contract,
          };
        }

        if (outerTxTag.value === Tag.ContractCreateTx) {
          return {
            sender: {
              address: senderId,
              name: getName(senderId).value,
              url: protocolExplorer.prepareUrlForAccount(senderId),
              label: t('transaction.overview.accountAddress'),
            },
            recipient: {
              label: t('transaction.overview.contractCreate'),
            },
          };
        }

        if (outerTxTag.value === Tag.NamePreclaimTx
          || outerTxTag.value === Tag.NameClaimTx
          || outerTxTag.value === Tag.NameUpdateTx
        ) {
          return {
            sender: {
              address: senderId,
              name: getName(senderId).value,
              url: protocolExplorer.prepareUrlForAccount(senderId),
              label: t('transaction.overview.accountAddress'),
            },
            recipient: {
              label: t('transaction.overview.aens'),
            },
          };
        }
      }

      // Handle EVM string-based transaction types
      if (isEvm(protocol.value)) {
        const txType = props.transaction.tx?.type;

        if (txType === 'SpendTx') {
          return {
            sender: {
              address: senderId,
              name: '', // EVM protocols don't have names like Aeternity
              url: protocolExplorer.prepareUrlForAccount(senderId),
              label: t('transaction.overview.accountAddress'),
            },
            recipient: getTransactionParty(recipientId),
          };
        }

        if (txType === 'ContractCallTx') {
          return {
            sender: {
              address: senderId,
              name: '', // EVM protocols don't have names like Aeternity
              url: protocolExplorer.prepareUrlForAccount(senderId),
              label: t('transaction.overview.accountAddress'),
            },
            recipient: {
              address: recipientId,
              name: '', // EVM protocols don't have names like Aeternity
              url: protocolExplorer.prepareUrlForAccount(recipientId),
              label: t('common.smartContract'),
            },
          };
        }
      }

      // Default fallback for unsupported transaction types
      throw new Error(`Unsupported transaction type ${outerTxTag.value || props.transaction.tx?.type} for protocol ${protocol.value}`);
    });

    onMounted(async () => {
      if (protocol.value === PROTOCOLS.aeternity) {
        if (innerTx.value.recipientId?.startsWith('nm_')) {
          name.value = await getNameByNameHash(innerTx.value.recipientId);
        }
      }
    });

    return {
      transactionParties,
    };
  },
});
</script>
