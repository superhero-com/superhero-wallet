<template>
  <Modal
    full-screen
    class="message-sign"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :title="$t('pages.popupMessageSign.title')"
      :sender="{ name: app.name, address: app.host, url: app.url }"
      :recipient="accountExtended"
    />

    <div
      class="subtitle"
      data-cy="aepp"
    >
      <span class="app-name">{{ app.name }}</span>
      ({{ app.host }}) {{ $t('pages.popupMessageSign.heading') }}
    </div>

    <DetailsItem
      :label="$t('pages.popupMessageSign.message')"
      data-cy="message"
    >
      <template #value>
        <CopyText :value="message" />
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
        :text="$t('pages.signTransaction.confirm')"
        :disabled="!isConnected"
        @click="resolve()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed, defineComponent, PropType,
} from 'vue';
import { useI18n } from 'vue-i18n';
import type { IAccount, IAccountLabeled, IAppData } from '../../../types';
import { useGetter } from '../../../composables/vuex';
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
  props: {
    message: { type: String, required: true },
    app: { type: Object as PropType<IAppData>, required: true },
    resolve: { type: Function as PropType<() => void>, required: true },
    // eslint-disable-next-line no-unused-vars
    reject: { type: Function as PropType<(e: Error) => void>, required: true },
  },
  setup(props) {
    const { t } = useI18n();

    const isConnected = useGetter('isConnected');
    const getExplorerPath = useGetter('getExplorerPath');
    const account = useGetter<IAccount>('account');
    const accountExtended = computed((): IAccountLabeled => ({
      ...account.value,
      label: t('transaction.overview.accountAddress'),
      url: getExplorerPath.value(account.value.address),
    }));

    function cancel() {
      props.reject(new Error('Rejected by user'));
    }

    return {
      isConnected,
      accountExtended,
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
