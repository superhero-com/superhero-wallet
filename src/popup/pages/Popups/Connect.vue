<template>
  <Modal
    show
    full-screen
    class="connect"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-labels="[
        ...(isUnknownDapp ? [$t('common.unknown')] : []),
        $t('pages.connectConfirm.title'),
      ]"
      :sender="sender"
      :recipient="activeAccount"
      :first-label-warning="isUnknownDapp"
    />

    <NoOriginWarning
      v-if="isUnknownDapp"
      :action="$t('unknownDapp.allowAccessAction')"
      :warning="$t('unknownDapp.allowAccessWarning')"
    />

    <div
      v-else
      class="subtitle"
      data-cy="aepp"
    >
      <span class="app-name">{{ sender.name }}</span>
      ({{ sender.address }}) {{ $t('pages.connectConfirm.websiteRequestConnect') }}
    </div>

    <div class="permissions">
      <DetailsItem
        v-if="access.includes(POPUP_CONNECT_ADDRESS_PERMISSION)"
        :label="$t('pages.connectConfirm.addressLabel')"
        :value="$t('pages.connectConfirm.addressRequest')"
      >
        <template #before-label>
          <CheckSuccessCircleIcon class="icon" />
        </template>
      </DetailsItem>
      <DetailsItem
        v-if="access.includes(POPUP_CONNECT_TRANSACTIONS_PERMISSION)"
        :label="$t('pages.connectConfirm.transactionLabel')"
        :value="$t('pages.connectConfirm.transactionRequest')"
      >
        <template #before-label>
          <CheckSuccessCircleIcon class="icon" />
        </template>
      </DetailsItem>
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
        :text="$t('common.allow')"
        @click="confirm()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onUnmounted,
} from 'vue';
import { RejectedByUserError } from '@/lib/errors';
import {
  PERMISSION_DEFAULTS,
  POPUP_CONNECT_ADDRESS_PERMISSION,
  POPUP_CONNECT_TRANSACTIONS_PERMISSION,
  PROTOCOLS,
  UNKNOWN_SOURCE,
} from '@/constants';
import { useAccounts, usePopupProps } from '@/composables';
import { usePermissions } from '@/composables/permissions';

import DetailsItem from '@/popup/components/DetailsItem.vue';
import NoOriginWarning from '@/popup/components/NoOriginWarning.vue';
import Modal from '../../components/Modal.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';
import TransactionInfo from '../../components/TransactionInfo.vue';

import CheckSuccessCircleIcon from '../../../icons/check-success-circle.svg?vue-component';

export default defineComponent({
  components: {
    DetailsItem,
    Modal,
    BtnMain,
    TransactionInfo,
    NoOriginWarning,
    CheckSuccessCircleIcon,
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

    const activeAccount = getLastActiveProtocolAccount(PROTOCOLS.aeternity);

    const isUnknownDapp = computed(() => (
      !popupProps.value?.app || popupProps.value.app.name === UNKNOWN_SOURCE
    ));

    const permission = computed(() => {
      const host = popupProps.value?.app?.host;
      return (host) ? permissions.value[host] : undefined;
    });

    function confirm() {
      addPermission({
        ...PERMISSION_DEFAULTS,
        ...(popupProps.value?.app || {}),
        ...(permission.value || {}),
      });
      popupProps.value?.resolve();
    }

    function cancel() {
      popupProps.value?.reject(new RejectedByUserError());
    }

    onUnmounted(() => {
      setPopupProps(null);
    });

    return {
      POPUP_CONNECT_ADDRESS_PERMISSION,
      POPUP_CONNECT_TRANSACTIONS_PERMISSION,
      activeAccount,
      isUnknownDapp,
      sender,
      confirm,
      cancel,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.connect {
  .transaction-info {
    margin-bottom: 16px;
  }

  .subtitle {
    @extend %face-sans-15-medium;

    margin-top: 24px;
    margin-bottom: 16px;
    color: $color-grey-light;
    text-align: center;

    .app-name {
      color: $color-white;
    }
  }

  .icon {
    width: 24px;
    height: 24px;
    padding-right: 4px;
    color: $color-success-dark;
  }

  .permissions {
    margin: 16px 0;
  }
}
</style>
