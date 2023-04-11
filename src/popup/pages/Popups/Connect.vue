<template>
  <Modal
    full-screen
    class="connect"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-title="$t('pages.connectConfirm.title')"
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
          <CheckMark class="icon" /> {{ $t('common.address') }}
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
        @click="confirm()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed, defineComponent, PropType,
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import type {
  IAccountLabeled,
  IAppData,
  IPermission,
} from '../../../types';
import { RejectedByUserError } from '../../../lib/errors';
import {
  PERMISSION_DEFAULTS,
  POPUP_CONNECT_ADDRESS_PERMISSION,
  POPUP_CONNECT_TRANSACTIONS_PERMISSION,
} from '../../utils';
import { useGetter, useState } from '../../../composables/vuex';
import { useAccounts } from '../../../composables';

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
    reject: { type: Function as PropType<(e: Error) => void>, required: true },
  },
  setup(props) {
    const store = useStore();
    const { t } = useI18n();

    const { activeAccount } = useAccounts({ store });

    const getExplorerPath = useGetter('getExplorerPath');

    const permission = useState<IPermission>('permissions', props.app.host);
    const appName = computed(() => permission.value?.name || props.app.name);
    const accountExtended = computed((): IAccountLabeled => ({
      ...activeAccount.value,
      label: t('transaction.overview.accountAddress'),
      url: getExplorerPath.value(activeAccount.value.address),
    }));

    function confirm() {
      store.commit('permissions/addPermission', {
        ...PERMISSION_DEFAULTS,
        ...props.app,
        ...permission.value,
      });
      props.resolve();
    }

    function cancel() {
      props.reject(new RejectedByUserError());
    }

    return {
      POPUP_CONNECT_ADDRESS_PERMISSION,
      POPUP_CONNECT_TRANSACTIONS_PERMISSION,
      appName,
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
