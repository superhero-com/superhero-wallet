<template>
  <Modal
    class="confirm"
    has-close-button
    from-bottom
    no-padding
    @close="closeModal"
  >
    <div class="content">
      <div class="icon-wrapper">
        <IconBoxed>
          <StatusIcon
            class="status-icon"
            :class="[action]"
            :status="statusIcon"
          />
        </IconBoxed>
      </div>

      <h2 class="text-heading-2 text-center">
        {{ confirmActionContent.title }}
      </h2>

      <FormSelect
        :value="activeAccount.address"
        :options="eligibleAccounts"
        :default-text="confirmActionContent.formSelectText"
        class="account-selector"
        persistent-default-text
        unstyled
        account-select
        @select="setActiveAccountByAddress($event)"
      />

      <div>
        <div class="active-account">
          <AccountItem :address="activeAccount.address" />
        </div>

        <div
          v-if="actionHasError"
          class="alert"
        >
          {{ actionHasError }}
        </div>
      </div>

      <div class="msg">
        {{ confirmActionContent.msg }}
      </div>
    </div>

    <template #footer>
      <BtnMain
        variant="muted"
        :text="$t('common.cancel')"
        @click="closeModal"
      />
      <BtnMain
        v-if="activeMultisigAccount"
        :variant="action === TX_FUNCTIONS_MULTISIG.revoke ? 'danger': 'primary'"
        data-cy="to-confirm"
        extra-padded
        :disabled="!!actionHasError"
        :text="confirmActionContent.btnText"
        @click="resolve"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import { TranslateResult, useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import type {
  IFormSelectOption,
  TxFunctionMultisig,
  RejectCallback,
  ResolveCallback,
  StatusIconType,
} from '@/types';
import { useAccounts, useMultisigAccounts, usePendingMultisigTransaction } from '@/composables';
import { TX_FUNCTIONS_MULTISIG } from '@/protocols/aeternity/config';

import Modal from '../Modal.vue';
import FormSelect from '../form/FormSelect.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AccountItem from '../AccountItem.vue';
import StatusIcon from '../StatusIcon.vue';
import IconBoxed from '../IconBoxed.vue';

export default defineComponent({
  components: {
    Modal,
    FormSelect,
    BtnMain,
    AccountItem,
    StatusIcon,
    IconBoxed,
  },
  props: {
    signers: { type: Array as PropType<string[]>, required: true },
    action: { type: String as PropType<TxFunctionMultisig>, required: true },
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup(props) {
    const store = useStore();
    const { tm } = useI18n();

    const {
      activeMultisigAccount,
    } = useMultisigAccounts({ store });
    const {
      activeAccount,
      setActiveAccountByAddress,
      prepareAccountSelectOptions,
    } = useAccounts({ store });
    const {
      pendingMultisigTxSigners,
      pendingMultisigTxConfirmedBy,
      pendingMultisigTxRefusedBy,
      pendingMultisigTxLocalSigners,
    } = usePendingMultisigTransaction({ store });

    const eligibleAccounts = computed(
      (): IFormSelectOption[] => prepareAccountSelectOptions(pendingMultisigTxLocalSigners.value),
    );

    const statusIcon = computed((): StatusIconType => (
      props.action === TX_FUNCTIONS_MULTISIG.confirm ? 'success' : 'critical'
    ));

    const confirmActionContent = computed((): Record<string, TranslateResult> => {
      switch (props.action) {
        case TX_FUNCTIONS_MULTISIG.confirm:
          return tm('pages.proposalDetails.signDialog');
        case TX_FUNCTIONS_MULTISIG.revoke:
          return tm('pages.proposalDetails.revokeDialog');
        default:
          return tm('pages.proposalDetails.refuseDialog');
      }
    });

    const actionHasError = computed(() => {
      const confirmActionText = confirmActionContent.value;
      if (!pendingMultisigTxSigners.value.includes(activeAccount.value.address)) {
        return confirmActionText.cannotDoActionWithSelectedAccount;
      }
      if (
        props.action === TX_FUNCTIONS_MULTISIG.revoke
        && activeMultisigAccount.value?.proposedBy !== activeAccount.value.address
      ) {
        return confirmActionText.cannotDoActionWithSelectedAccount;
      }
      if (
        props.action === TX_FUNCTIONS_MULTISIG.confirm
        && pendingMultisigTxConfirmedBy.value.includes(activeAccount.value.address)
      ) {
        return confirmActionText.selectedAccountAlreadyDoneThisAction;
      }
      if (
        props.action === TX_FUNCTIONS_MULTISIG.refuse
        && pendingMultisigTxRefusedBy.value.includes(activeAccount.value.address)
      ) {
        return confirmActionText.selectedAccountAlreadyDoneThisAction;
      }
      return null;
    });

    function closeModal() {
      props.reject();
    }

    return {
      statusIcon,
      closeModal,
      eligibleAccounts,
      activeAccount,
      setActiveAccountByAddress,
      activeMultisigAccount,
      confirmActionContent,
      actionHasError,
      TX_FUNCTIONS_MULTISIG,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.confirm {
  text-align: center;

  .content {
    padding: 8px 24px;
  }

  .text-heading-2 {
    margin-bottom: 16px;
  }

  .account-selector {
    margin: 0 auto;
    padding-bottom: 8px;
  }

  .active-account {
    @include mixins.flex(center, space-between, row);

    margin-bottom: 22px;
  }

  .alert {
    @extend %face-sans-14-regular;

    align-items: center;
    text-align: center;
    margin: 10px 0;
    padding: 8px 12px;
    border-radius: 4px;
    color: rgba(variables.$color-danger, 0.75);
    line-height: 19px;
  }

  .msg {
    @extend %face-sans-15-regular;

    color: rgba(variables.$color-white, 0.85);
    padding: 0 18px;
  }

  .icon-wrapper {
    margin-bottom: 20px;

    .status-icon {
      margin: 8px;

      &.refuse {
        color: variables.$color-warning;
      }
    }
  }
}
</style>
