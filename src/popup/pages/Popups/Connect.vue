<template>
  <Modal
    show
    full-screen
    class="connect"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-title="$t('pages.connectConfirm.title')"
      :sender="sender"
      :recipient="activeAccount"
    />

    <div
      class="subtitle"
      data-cy="aepp"
    >
      <span class="app-name">{{ sender.name }}</span>
      ({{ sender.address }}) {{ $t('pages.connectConfirm.websiteRequestConnect') }}
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
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
} from 'vue';
import { RejectedByUserError } from '@/lib/errors';
import {
  PERMISSION_DEFAULTS,
  POPUP_CONNECT_ADDRESS_PERMISSION,
  POPUP_CONNECT_TRANSACTIONS_PERMISSION,
  PROTOCOL_AETERNITY,
} from '@/constants';
import { useAccounts, usePopupProps } from '@/composables';
import { usePermissions } from '@/composables/permissions';

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
    access: {
      type: Array,
      default: () => ([
        POPUP_CONNECT_ADDRESS_PERMISSION,
        POPUP_CONNECT_TRANSACTIONS_PERMISSION,
      ]),
    },
  },
  setup() {
    const { getLastActiveProtocolAccount } = useAccounts();
    const { popupProps, sender, setPopupProps } = usePopupProps();
    const { permissions, addPermission } = usePermissions();

    const activeAccount = getLastActiveProtocolAccount(PROTOCOL_AETERNITY);

    const permission = computed(() => {
      const host = popupProps.value?.app?.host;
      return (host) ? permissions.value[host] : undefined;
    });

    const appName = computed(() => permission.value?.name || popupProps.value?.app?.name);

    function confirm() {
      addPermission({
        ...PERMISSION_DEFAULTS,
        ...popupProps.value?.app,
        ...permission.value,
      });
      popupProps.value?.resolve();
    }

    function cancel() {
      popupProps.value?.reject(new RejectedByUserError());
    }

    onMounted(() => {
      sender.value.name = appName.value;
    });

    onUnmounted(() => {
      setPopupProps(null);
    });

    return {
      POPUP_CONNECT_ADDRESS_PERMISSION,
      POPUP_CONNECT_TRANSACTIONS_PERMISSION,
      activeAccount,
      sender,
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
