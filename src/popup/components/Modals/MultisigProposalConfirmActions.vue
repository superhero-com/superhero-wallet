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
        {{ $rt(confirmActionContent.title) }}
      </h2>

      <FormSelect
        :value="chosenAccountAddress"
        :options="eligibleAccounts"
        :default-text="$rt(confirmActionContent.formSelectText)"
        class="account-selector"
        persistent-default-text
        unstyled
        account-select
        @select="chosenAccountAddress = $event"
      />

      <div>
        <div class="active-account">
          <AccountItem
            :address="chosenAccountAddress"
            :protocol="PROTOCOLS.aeternity"
          />
        </div>

        <div
          v-if="actionHasError"
          class="alert"
        >
          {{ $rt(actionHasError) }}
        </div>
      </div>

      <div class="msg">
        {{ $rt(confirmActionContent.msg) }}
      </div>
    </div>

    <template #footer>
      <div class="footer">
        <BtnMain
          variant="muted"
          :text="$t('common.cancel')"
          @click="closeModal"
        />
        <BtnMain
          v-if="activeMultisigAccount"
          :variant="action === TX_FUNCTIONS_MULTISIG.revoke ? 'danger' : 'primary'"
          data-cy="to-confirm"
          extra-padded
          :disabled="!!actionHasError"
          :text="$rt(confirmActionContent.btnText)"
          @click="resolve(chosenAccountAddress)"
        />
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  PropType,
} from 'vue';
import { TranslateResult, useI18n } from 'vue-i18n';
import type {
  IFormSelectOption,
  TxFunctionMultisig,
  RejectCallback,
  ResolveCallback,
  StatusIconType,
  AccountAddress,
} from '@/types';
import { PROTOCOLS } from '@/constants';
import { prepareAccountSelectOptions } from '@/utils';
import { useMultisigAccounts, usePendingMultisigTransaction } from '@/composables';
import { TX_FUNCTIONS_MULTISIG } from '@/protocols/aeternity/config';

import Modal from '../Modal.vue';
import FormSelect from '../form/FormSelect.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AccountItem from '../AccountItem.vue';
import StatusIcon from '../StatusIcon.vue';
import IconBoxed from '../IconBoxed.vue';

export type MultisigProposalConfirmActionVal = AccountAddress;

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
    resolve: {
      type: Function as PropType<ResolveCallback<MultisigProposalConfirmActionVal>>,
      required: true,
    },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup(props) {
    const { tm } = useI18n();

    const { activeMultisigAccount } = useMultisigAccounts();
    const {
      pendingMultisigTxConfirmedBy,
      pendingMultisigTxRefusedBy,
      pendingMultisigTxLocalSigners,
    } = usePendingMultisigTransaction();

    const chosenAccountAddress = ref<AccountAddress>(
      pendingMultisigTxLocalSigners.value[0].address,
    );

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
      if (
        props.action === TX_FUNCTIONS_MULTISIG.revoke
        && activeMultisigAccount.value?.proposedBy !== chosenAccountAddress.value
      ) {
        return confirmActionText.cannotDoActionWithSelectedAccount;
      }
      if (
        props.action === TX_FUNCTIONS_MULTISIG.confirm
        && pendingMultisigTxConfirmedBy.value.includes(chosenAccountAddress.value)
      ) {
        return confirmActionText.selectedAccountAlreadyDoneThisAction;
      }
      if (
        props.action === TX_FUNCTIONS_MULTISIG.refuse
        && pendingMultisigTxRefusedBy.value.includes(chosenAccountAddress.value)
      ) {
        return confirmActionText.selectedAccountAlreadyDoneThisAction;
      }
      return null;
    });

    function closeModal() {
      props.reject();
    }

    return {
      PROTOCOLS,
      TX_FUNCTIONS_MULTISIG,
      statusIcon,
      closeModal,
      chosenAccountAddress,
      eligibleAccounts,
      activeMultisigAccount,
      confirmActionContent,
      actionHasError,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

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
    color: rgba($color-danger, 0.75);
    line-height: 19px;
  }

  .msg {
    @extend %face-sans-15-regular;

    color: rgba($color-white, 0.85);
    padding: 0 18px;
  }

  .icon-wrapper {
    margin-bottom: 20px;

    .status-icon {
      margin: 8px;

      &.refuse {
        color: $color-warning;
      }
    }
  }

  .footer {
    display: flex;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding-bottom: 24px;
    padding-inline: 24px;
  }
}
</style>
