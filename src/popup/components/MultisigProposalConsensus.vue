<template>
  <div class="transaction-multisig-consensus">
    <div
      v-if="!isPendingMultisigTxCompleted"
      class="label"
    >
      <span> {{ $t('multisig.consensus') }} </span>
      <span class="confirmations-count">
        <ConsensusLabel
          :confirmations-required="activeMultisigAccount.confirmationsRequired"
          :has-pending-transaction="activeMultisigAccount.hasPendingTransaction"
          :confirmed-by="activeMultisigAccount.confirmedBy"
          :signers="activeMultisigAccount.signers"
        />
      </span>
    </div>
    <div class="consensus">
      <div
        v-if="!isPendingMultisigTxCompleted"
        class="signers"
      >
        <div
          v-for="signer of pendingMultisigTxSortedSigners"
          :key="signer"
          class="signer"
        >
          <AccountItem :address="signer" />

          <CheckCircle
            v-if="pendingMultisigTxConfirmedBy.includes(signer) || proposalCompleted"
            class="check-icon active"
          />
          <CloseCircle
            v-else-if="pendingMultisigTxRefusedBy.includes(signer)"
            class="close-icon"
          />
          <CheckCircle
            v-else
            class="check-icon"
          />

          <DialogBox
            v-if="isLocalAccountAddress(signer)"
            dense
          >
            {{ $t('common.you') }}
          </DialogBox>
        </div>
      </div>
      <InfoBox :type="infoBox.type">
        {{ infoBox.content }}
      </InfoBox>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, getCurrentInstance } from 'vue';
import { TranslateResult } from 'vue-i18n';
import { useStore } from 'vuex';
import { useAccounts, useMultisigAccounts, usePendingMultisigTransaction } from '../../composables';
import AccountItem from './AccountItem.vue';
import DialogBox from './DialogBox.vue';
import InfoBox, { InfoBoxType, INFO_BOX_TYPES } from './InfoBox.vue';

import CheckCircle from '../../icons/circle-check-outlined.svg?vue-component';
import CloseCircle from '../../icons/circle-close.svg?vue-component';
import ConsensusLabel from './ConsensusLabel.vue';

export default defineComponent({
  name: 'TransactionMultisigConsensus',
  components: {
    ConsensusLabel,
    AccountItem,
    CheckCircle,
    CloseCircle,
    DialogBox,
    InfoBox,
  },
  props: {
    proposalCompleted: Boolean,
  },
  setup(props: any) {
    console.log(props);
    const instance = getCurrentInstance();
    const root = instance?.root as any;
    const store = useStore();
    const {
      activeMultisigAccount,
    } = useMultisigAccounts({ store });
    const {
      accounts,
      isLocalAccountAddress,
    } = useAccounts({
      store,
    });
    const {
      pendingMultisigTxConfirmedBy,
      pendingMultisigTxRefusedBy,
      pendingMultisigTxSortedSigners,
      pendingMultisigTxConfirmed,
      pendingMultisigTxRevoked,
      pendingMultisigTxProposingAccountRevoked,
      pendingMultisigTxRequiredConfirmations,
      pendingMultisigTxPendingConfirmationsCount,
      pendingMultisigTxExpired,
      isPendingMultisigTxCompleted,
      isPendingMultisigTxCompletedAndRevoked,
      isPendingMultisigTxCompletedAndConfirmed,
    } = usePendingMultisigTransaction({
      store,
    });
    const getExplorerPath = computed(() => store.getters.getExplorerPath);

    const infoBox = computed((): { content: TranslateResult, type: InfoBoxType } => {
      if (props.proposalCompleted || isPendingMultisigTxCompletedAndConfirmed.value) {
        return {
          content: root.$t('pages.proposalDetails.infoBox.completed'),
          type: INFO_BOX_TYPES.success,
        };
      }

      if (pendingMultisigTxExpired.value) {
        return {
          content: root.$t('pages.proposalDetails.infoBox.expired'),
          type: INFO_BOX_TYPES.warning,
        };
      }

      if (pendingMultisigTxConfirmed.value) {
        return {
          content: root.$t('pages.proposalDetails.infoBox.approved'),
          type: INFO_BOX_TYPES.default,
        };
      }

      if (isPendingMultisigTxCompletedAndRevoked.value) {
        return {
          content: root.$t('pages.proposalDetails.infoBox.justRevoked'),
          type: INFO_BOX_TYPES.danger,
        };
      }

      if (pendingMultisigTxProposingAccountRevoked.value) {
        return {
          content: root.$t('pages.proposalDetails.infoBox.proposingAccountRevoked'),
          type: INFO_BOX_TYPES.danger,
        };
      }

      if (pendingMultisigTxRevoked.value) {
        return {
          content: root.$t('pages.proposalDetails.infoBox.revoked', [
            pendingMultisigTxRefusedBy.value.length,
            pendingMultisigTxRequiredConfirmations.value,
          ]),
          type: INFO_BOX_TYPES.danger,
        };
      }

      return {
        content: root.$t('pages.proposalDetails.infoBox.pending', [
          pendingMultisigTxPendingConfirmationsCount.value,
          pendingMultisigTxPendingConfirmationsCount.value > 1
            ? root.$t('pages.proposalDetails.infoBox.signatures')
            : root.$t('pages.proposalDetails.infoBox.signature'),
        ]),
        type: INFO_BOX_TYPES.default,
      };
    });

    return {
      activeMultisigAccount,
      getExplorerPath,
      accounts,
      isLocalAccountAddress,
      infoBox,
      pendingMultisigTxSortedSigners,
      pendingMultisigTxConfirmedBy,
      pendingMultisigTxRefusedBy,
      isPendingMultisigTxCompleted,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.transaction-multisig-consensus {
  width: 100%;

  .label {
    @extend %face-sans-15-medium;

    display: flex;
    align-items: center;
    margin-bottom: 4px;
    line-height: 16px;
    color: rgba(variables.$color-white, 0.5);

    .confirmations-count {
      padding-left: 4px;
      color: rgba(variables.$color-white, 0.75);
    }
  }

  .consensus {
    .signers {
      .signer {
        @include mixins.flex(flex-start, center, row);

        gap: 4px;
        margin-bottom: 6px;

        .check-icon,
        .close-icon {
          width: 20px;
          height: 20px;
          margin-top: 5px;
          margin-left: 20px;
          margin-right: 4px;
          opacity: 0.5;

          &.active {
            color: variables.$color-success;
            opacity: 1;
          }
        }

        .close-icon {
          color: variables.$color-danger;
          opacity: 1;
        }
      }
    }
  }
}
</style>
