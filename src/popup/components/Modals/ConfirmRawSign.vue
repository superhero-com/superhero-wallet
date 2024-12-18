<template>
  <Modal
    show
    full-screen
    class="confirm-raw-sign"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-labels="[
        ...(isUnknownDapp ? [$t('common.unknown')] : []),
        $t('modals.confirm-raw-sign.title'),
      ]"
      :sender="sender"
      :recipient="activeAccount!"
      :first-label-warning="isUnknownDapp"
    />

    <NoOriginWarning
      v-if="isUnknownDapp"
      :action="$t('unknownDapp.signDataAction')"
      :warning="$t('unknownDapp.signDataWarning')"
    />

    <div
      class="warning"
      data-cy="warning"
    >
      <span class="title">
        <Warning class="icon" />
        {{ $t('modals.confirm-raw-sign.warning.title') }}
      </span>
      <i18n-t
        keypath="modals.confirm-raw-sign.warning.content"
        tag="span"
        class="content"
        scope="global"
      >
        <br>
      </i18n-t>
    </div>

    <DetailsItem
      :label="$t('modals.confirmTransactionSign.data-sign')"
      data-cy="data"
    >
      <template #value>
        <CopyText :value="dataAsString" />
      </template>
    </DetailsItem>

    <template #footer>
      <BtnMain
        variant="muted"
        third
        extra-padded
        :text="$t('common.cancel')"
        @click="cancel"
      />
      <BtnMain
        third
        :text="$t('common.confirm')"
        @click="confirm"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { computed, defineComponent, onUnmounted } from 'vue';
import {
  AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE,
  MODAL_SIGN_AIR_GAP_TRANSACTION,
  PROTOCOLS,
  RUNNING_IN_POPUP,
} from '@/constants';
import { RejectedByUserError } from '@/lib/errors';
import { useAccounts, useModals, usePopupProps } from '@/composables';

import { type SignAirGapTransactionResolvedVal } from './SignAirGapTransaction.vue';

import Modal from '../Modal.vue';
import TransactionInfo from '../TransactionInfo.vue';
import BtnMain from '../buttons/BtnMain.vue';
import DetailsItem from '../DetailsItem.vue';
import CopyText from '../CopyText.vue';

import Warning from '../../../icons/warning.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    TransactionInfo,
    BtnMain,
    DetailsItem,
    Warning,
    CopyText,
  },
  setup() {
    const {
      isUnknownDapp,
      popupProps,
      sender,
      setPopupProps,
    } = usePopupProps();
    const { getLastActiveProtocolAccount } = useAccounts();
    const { openModal } = useModals();

    const activeAccount = getLastActiveProtocolAccount(PROTOCOLS.aeternity);

    const dataAsString = computed((): string => popupProps.value?.txBase64?.toString() || '');

    async function confirm() {
      if (RUNNING_IN_POPUP && activeAccount?.type === 'airgap') {
        const signedTransaction = await openModal<SignAirGapTransactionResolvedVal>(
          MODAL_SIGN_AIR_GAP_TRANSACTION,
          { txRaw: popupProps.value?.txBase64 },
        );
        if (signedTransaction) {
          browser.runtime.sendMessage({
            type: AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE,
            payload: signedTransaction,
            target: 'offscreen',
          });
        }
      }
      popupProps.value?.resolve();
    }

    function cancel() {
      popupProps.value?.reject(new RejectedByUserError());
    }

    onUnmounted(() => {
      setPopupProps(null);
    });

    return {
      confirm,
      cancel,
      activeAccount,
      dataAsString,
      isUnknownDapp,
      sender,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.confirm-raw-sign {
  .overview {
    margin: 16px;
  }

  .warning {
    margin-block: 16px;
    text-align: left;

    .title {
      @extend %face-sans-15-medium;

      display: flex;
      align-items: center;
      margin-bottom: 4px;
      color: $color-warning;

      .icon {
        width: 24px;
        height: 24px;
        padding-right: 4px;
      }
    }

    .content {
      @extend %face-sans-15-regular;

      color: $color-white;
    }
  }

  .details-item {
    margin-top: 24px;
    text-align: left;
  }
}
</style>
