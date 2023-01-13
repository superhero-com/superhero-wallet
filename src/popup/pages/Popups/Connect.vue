<template>
  <Modal
    full-screen
    class="connect"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :title="$t('pages.connectConfirm.title')"
      :sender="{ name: appName, address: app.host, url: app.url }"
      :recipient="accountExtended"
    />

    <div
      class="subtitle"
      data-cy="aepp"
    >
      <span class="app-name">{{ appName }}</span>
      ({{ app.host }}) {{ $t('pages.connectConfirm.websiteRequestconnect') }}
    </div>

    <div class="permissions">
      <template v-if="access.includes(POPUP_CONNECT_ADDRESS_PERMISSION)">
        <span class="title">
          <CheckMark class="icon" /> {{ $t('pages.connectConfirm.addressLabel') }}
        </span>
        <span class="description">
          {{ $t('pages.connectConfirm.addressRequest') }}
        </span>
      </template>
      <template v-if="access.includes(POPUP_CONNECT_TRANSACTIONS_PERMISSION)">
        <span class="title">
          <CheckMark class="icon" /> {{ $t('pages.connectConfirm.transactionLabel') }}
        </span>
        <span class="description">
          {{ $t('pages.connectConfirm.transactionRequest') }}
        </span>
      </template>
    </div>

    <template #footer>
      <BtnMain
        variant="muted"
        data-cy="deny"
        extra-padded
        :text="$t('pages.connectConfirm.cancelButton')"
        @click="cancel()"
      />
      <BtnMain
        data-cy="accept"
        :text="$t('pages.connectConfirm.confirmButton')"
        :disabled="!isConnected"
        @click="confirm()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api';
import type {
  IAccount,
  IAccountLabeled,
  IAppData,
  IPermission,
} from '../../../types';
import {
  PERMISSION_DEFAULTS,
  POPUP_CONNECT_ADDRESS_PERMISSION,
  POPUP_CONNECT_TRANSACTIONS_PERMISSION,
} from '../../utils';
import { useGetter, useState } from '../../../composables/vuex';

import Modal from '../../components/Modal.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';
import TransactionInfo from '../../components/TransactionInfo.vue';
import CheckMark from '../../../icons/check-mark.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    TransactionInfo,
    CheckMark,
  },
  props: {
    app: { type: Object as PropType<IAppData>, required: true },
    access: {
      type: Array,
      default: () => ([
        POPUP_CONNECT_ADDRESS_PERMISSION,
        POPUP_CONNECT_TRANSACTIONS_PERMISSION,
      ]),
    },
    resolve: { type: Function as PropType<() => void>, required: true },
    // eslint-disable-next-line no-unused-vars
    reject: { type: Function as PropType<(e: Error) => void>, required: true },
  },
  setup(props, { root }) {
    const isConnected = useGetter('isConnected');
    const getExplorerPath = useGetter('getExplorerPath');
    const account = useGetter<IAccount>('account');

    const permission = useState<IPermission>('permissions', props.app.host);
    const appName = computed(() => permission.value?.name || props.app.name);
    const accountExtended = computed((): IAccountLabeled => ({
      ...account.value,
      label: root.$t('transaction.overview.accountAddress'),
      url: getExplorerPath.value(account.value.address),
    }));

    function confirm() {
      root.$store.commit('permissions/addPermission', {
        ...PERMISSION_DEFAULTS,
        ...props.app,
        ...permission.value,
      });
      props.resolve();
    }

    function cancel() {
      props.reject(new Error('Rejected by user'));
    }

    return {
      POPUP_CONNECT_ADDRESS_PERMISSION,
      POPUP_CONNECT_TRANSACTIONS_PERMISSION,
      appName,
      isConnected,
      accountExtended,
      confirm,
      cancel,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.connect {
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

  .permissions {
    margin: 16px 0;

    .title {
      @extend %face-sans-15-medium;

      display: flex;
      align-items: center;
      padding-bottom: 4px;
      color: variables.$color-grey-dark;

      .icon {
        width: 24px;
        height: 24px;
        color: variables.$color-success;
        padding-right: 4px;
      }
    }

    .description {
      @extend %face-sans-15-regular;

      display: block;
      padding-bottom: 16px;
      color: variables.$color-white;
      text-align: left;
    }
  }
}
</style>
