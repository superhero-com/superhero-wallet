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
      :recipient="account"
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
      :value="dataAsString"
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
import { computed, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { IAccountLabeled, IAccountOverView } from '../../../types';
import Modal from '../Modal.vue';
import TransactionInfo from '../TransactionInfo.vue';
import BtnMain from '../buttons/BtnMain.vue';
import DetailsItem from '../DetailsItem.vue';
import Warning from '../../../icons/warning.svg?vue-component';
import CopyText from '../CopyText.vue';
import { usePopupProps } from '../../../composables';
import { useGetter } from '../../../composables/vuex';

export default {
  components: {
    Modal,
    TransactionInfo,
    BtnMain,
    DetailsItem,
    Warning,
    CopyText,
  },
  setup() {
    const { popupProps, setPopupProps } = usePopupProps();
    const { t } = useI18n();
    const store = useStore();

    const dataAsString = computed(() => {
      if (typeof popupProps.value?.data === 'string') return popupProps.value?.data;
      return Buffer.from(popupProps.value?.data as any).toString('hex');
    });
    const sender = computed((): IAccountOverView => ({
      name: popupProps.value?.app?.name,
      address: popupProps.value?.app?.host,
      url: popupProps.value?.app?.url,
    }));

    const getExplorerPath = useGetter('fungibleTokens/getTokenBalance');
    const account: IAccountLabeled = {
      ...store.getters.account,
      label: t('transaction.overview.accountAddress'),
      url: getExplorerPath.value(store.getters.account.address),
    };

    function confirm() {
      popupProps.value?.resolve();
    }

    function cancel() {
      popupProps.value?.reject(new Error('Rejected by user'));
    }

    onUnmounted(() => {
      setPopupProps(null);
    });

    return {
      confirm,
      cancel,
      account,
      dataAsString,
      sender,
    };
  },
};
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
