<template>
  <Modal
    show
    full-screen
    class="message-sign"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-title="$t('pages.popupMessageSign.title')"
      :sender="sender"
      :recipient="accountExtended"
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
        :disabled="!isConnected"
        @click="popupProps?.resolve()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { computed, defineComponent, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import type { IAccountLabeled, IAccountOverView } from '../../../types';
import { useGetter } from '../../../composables/vuex';
import { useAccounts, usePopupProps } from '../../../composables';

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
    const store = useStore();
    const { activeAccount } = useAccounts({ store });
    const { popupProps, setPopupProps } = usePopupProps();
    const { t } = useI18n();

    const isConnected = useGetter('isConnected');
    const getExplorerPath = useGetter('getExplorerPath');

    const accountExtended = computed((): IAccountLabeled => ({
      ...activeAccount.value,
      label: t('transaction.overview.accountAddress'),
      url: getExplorerPath.value(activeAccount.value.address),
    }));
    const sender = computed((): IAccountOverView => ({
      name: popupProps.value?.app?.name,
      address: popupProps.value?.app?.host,
      url: popupProps.value?.app?.url,
    }));

    function cancel() {
      popupProps.value?.reject(new Error('Rejected by user'));
    }

    onUnmounted(() => {
      setPopupProps(null);
    });

    return {
      isConnected,
      accountExtended,
      popupProps,
      sender,
      cancel,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.message-sign {
  .transaction-info {
    margin-bottom: 16px;
  }

  .subtitle {
    @extend %face-sans-15-medium;

    margin-top: 24px;
    margin-bottom: 16px;
    color: variables.$color-grey-light;
    text-align: center;

    .app-name {
      color: variables.$color-white;
    }
  }

  .details-item {
    margin: 16px;
    text-align: left;
  }
}
</style>
