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
import { Encoded, Tag } from '@aeternity/aepp-sdk';
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
  toRef,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { BytecodeContractCallEncoder } from '@aeternity/aepp-calldata';

import type {
  AccountAddress,
  IAccountOverview,
  ITransaction,
} from '@/types';
import { PROTOCOLS, TX_DIRECTION } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useAeSdk, useTransactionData } from '@/composables';

import type { AeDecodedCallData } from '@/protocols/aeternity/types';
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

    const { getAeSdk } = useAeSdk();
    const { getName, getNameByNameHash } = useAeNames();

    const name = ref('');
    const ownershipAccount = ref<IAccountOverview>({} as IAccountOverview);
    const protocol = computed(() => props.transaction.protocol || PROTOCOLS.aeternity);
    const adapter = ProtocolAdapterFactory.getAdapter(protocol.value);
    const protocolExplorer = adapter.getExplorer();

    const {
      isDex,
      innerTx,
      innerTxTag,
      outerTxTag,
      direction,
      getOwnershipAddress,
    } = useTransactionData({
      transaction: toRef(() => props.transaction),
    });

    function getTransactionParty(address: AccountAddress): IAccountOverview {
      return {
        address,
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

      const transactionTag = (
        outerTxTag.value === Tag.PayingForTx
        || outerTxTag.value === Tag.GaMetaTx
      ) ? innerTxTag.value : outerTxTag.value;

      switch (transactionTag) {
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
          };

        case Tag.ContractCallTx: {
          const contract: IAccountOverview = {
            address: contractId,
            url: protocolExplorer.prepareUrlForHash(contractId),
            label: (isDex.value && protocol.value === PROTOCOLS.aeternity)
              ? t('transaction.overview.superheroDex')
              : t('common.smartContract'),
          };

          if (protocol.value === PROTOCOLS.ethereum) {
            return {
              sender: {
                address: senderId,
                url: protocolExplorer.prepareUrlForAccount(senderId),
                label: t('transaction.overview.accountAddress'),
              },
              recipient: {
                address: recipientId,
                url: protocolExplorer.prepareUrlForAccount(recipientId),
                label: t('common.smartContract'),
              },
            };
          }

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
          };
        }

        case Tag.ContractCreateTx:
          return {
            sender: ownershipAccount.value,
            recipient: {
              label: t('transaction.overview.contractCreate'),
            },
          };

        case Tag.NamePreclaimTx:
        case Tag.NameClaimTx:
        case Tag.NameUpdateTx:
          return {
            sender: ownershipAccount.value,
            recipient: {
              label: t('transaction.overview.aens'),
            },
          };

        default:
          throw new Error(`Unsupported transaction type ${outerTxTag.value}`);
      }
    });

    async function decodeClaimTransactionAccount(): Promise<Encoded.AccountAddress | undefined> {
      // eslint-disable-next-line camelcase
      const calldata = innerTx.value.callData || innerTx.value.call_data;

      if (!(innerTx.value.contractId && calldata)) {
        return undefined;
      }

      const aeSdk = await getAeSdk();
      const { bytecode } = await aeSdk.getContractByteCode(innerTx.value.contractId);

      const bytecodeContractCallEncoder = new BytecodeContractCallEncoder(bytecode);

      const txParams = bytecodeContractCallEncoder.decodeCall(calldata) as AeDecodedCallData;
      if (!txParams) return undefined;

      return txParams.args?.[0] as Encoded.AccountAddress;
    }

    onMounted(async () => {
      if (innerTx.value.recipientId?.startsWith('nm_')) {
        name.value = await getNameByNameHash(innerTx.value.recipientId);
      }
      let transactionOwnerAddress;
      if (innerTx.value.function === TX_FUNCTIONS.claim) {
        transactionOwnerAddress = await decodeClaimTransactionAccount();
      }
      const address = getOwnershipAddress(transactionOwnerAddress);
      ownershipAccount.value = {
        address,
        name: getName(address as Encoded.AccountAddress).value,
        label: t('transaction.overview.accountAddress'),
        url: protocolExplorer.prepareUrlForAccount(address as Encoded.AccountAddress),
      };
    });

    return {
      transactionParties,
    };
  },
});
</script>
