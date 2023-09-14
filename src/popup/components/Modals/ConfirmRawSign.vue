<template>
  <Modal
    show
    full-screen
    class="confirm-raw-sign"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-title="$t('modals.confirm-raw-sign.title')"
      :sender="sender"
      :recipient="activeAccount"
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
import { PROTOCOL_AETERNITY } from '@/constants';
import { RejectedByUserError } from '../../../lib/errors';
import { useAccounts, usePopupProps } from '../../../composables';

import Modal from '../Modal.vue';
import TransactionInfo from '../TransactionInfo.vue';
import BtnMain from '../buttons/BtnMain.vue';
import DetailsItem from '../DetailsItem.vue';
import Warning from '../../../icons/warning.svg?vue-component';
import CopyText from '../CopyText.vue';

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
    const { popupProps, sender, setPopupProps } = usePopupProps();
    const { getLastActiveProtocolAccount } = useAccounts();

    const activeAccount = getLastActiveProtocolAccount(PROTOCOL_AETERNITY);

    const dataAsString = computed(
      (): string => (typeof popupProps.value?.data === 'string')
        ? popupProps.value?.data
        : Buffer.from(popupProps.value?.data as any).toString('hex'),
    );

    function confirm() {
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
      sender,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.confirm-raw-sign {
  .overview {
    margin: 16px;
  }

  .warning {
    margin: 16px;
    text-align: left;

    .title {
      @extend %face-sans-15-medium;

      display: flex;
      align-items: center;
      margin-bottom: 4px;
      color: variables.$color-warning;

      .icon {
        width: 24px;
        height: 24px;
        padding-right: 4px;
      }
    }

    .content {
      @extend %face-sans-15-regular;

      color: variables.$color-white;
    }
  }

  .details-item {
    margin: 24px 16px 16px;
    text-align: left;
  }
}
</style>
