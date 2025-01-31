<template>
  <Modal
    show
    full-screen
    class="message-sign"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-labels="[
        ...(isUnknownDapp ? [$t('common.unknown')] : []),
        $t('pages.popupMessageSign.title'),
      ]"
      :sender="sender"
      :recipient="activeAccount"
      :first-label-warning="isUnknownDapp"
    />
    <NoOriginWarning
      v-if="isUnknownDapp"
      :action="$t('unknownDapp.signMessageAction')"
      :warning="$t('unknownDapp.signMessageWarning')"
    />
    <div
      v-else
      class="subtitle"
      data-cy="aepp"
    >
      <span class="app-name">{{ sender.name }}</span>
      ({{ sender.address }}) {{ $t('pages.popupMessageSign.heading') }}
    </div>

    <DetailsItem
      :label="$t('pages.popupMessageSign.message')"
      data-cy="message"
      class="message-text"
    >
      <template #value>
        <CopyText :value="popupProps?.message" />
      </template>
    </DetailsItem>

    <template #footer>
      <BtnMain
        variant="muted"
        data-cy="deny"
        extra-padded
        :text="$t('pages.signTransaction.reject')"
        @click="cancel()"
      />
      <BtnMain
        data-cy="accept"
        :text="$t('common.confirm')"
        @click="approve()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, onUnmounted } from 'vue';
import {
  ACCOUNT_TYPES,
  MODAL_LEDGER_SIGN,
  PROTOCOLS,
  RUNNING_IN_POPUP,
} from '@/constants';
import { RejectedByUserError } from '@/lib/errors';
import { useAccounts, usePopupProps, useModals } from '@/composables';

import NoOriginWarning from '@/popup/components/NoOriginWarning.vue';
import Modal from '../../components/Modal.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';
import TransactionInfo from '../../components/TransactionInfo.vue';
import DetailsItem from '../../components/DetailsItem.vue';
import CopyText from '../../components/CopyText.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    TransactionInfo,
    DetailsItem,
    CopyText,
    NoOriginWarning,
  },
  setup() {
    const { getLastActiveProtocolAccount } = useAccounts();
    const {
      isUnknownDapp,
      popupProps,
      sender,
      setPopupProps,
    } = usePopupProps();

    const activeAccount = getLastActiveProtocolAccount(PROTOCOLS.aeternity);

    async function approve() {
      const { openModal } = useModals();
      if (RUNNING_IN_POPUP && activeAccount?.type === ACCOUNT_TYPES.ledger) {
        await openModal(MODAL_LEDGER_SIGN);
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
      activeAccount,
      isUnknownDapp,
      popupProps,
      sender,
      approve,
      cancel,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.message-sign {
  .subtitle {
    @extend %face-sans-15-medium;

    margin-top: 28px;
    margin-bottom: 16px;
    color: $color-grey-light;
    text-align: center;

    .app-name {
      color: $color-white;
    }
  }

  .message-text {
    margin-top: 16px;
  }
}
</style>
