<template>
  <Modal
    show
    full-screen
    class="message-sign"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-labels="[$t('pages.popupMessageSign.title')]"
      :sender="sender"
      :recipient="activeAccount"
    />

    <div
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
        @click="popupProps?.resolve()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, onUnmounted } from 'vue';
import { PROTOCOLS } from '@/constants';
import { RejectedByUserError } from '@/lib/errors';
import { useAccounts, usePopupProps } from '@/composables';

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
  },
  setup() {
    const { getLastActiveProtocolAccount } = useAccounts();
    const { popupProps, sender, setPopupProps } = usePopupProps();

    const activeAccount = getLastActiveProtocolAccount(PROTOCOLS.aeternity);

    function cancel() {
      popupProps.value?.reject(new RejectedByUserError());
    }

    onUnmounted(() => {
      setPopupProps(null);
    });

    return {
      activeAccount,
      popupProps,
      sender,
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
