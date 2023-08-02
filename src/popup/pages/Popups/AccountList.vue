<template>
  <Modal
    show
    full-screen
    class="account-list"
    data-cy="popup-aex2"
  >
    <TransactionInfo
      :custom-title="$t('pages.connectConfirm.title')"
      :sender="sender"
      :recipient="recipient"
    />

    <div
      class="subtitle"
      data-cy="aepp"
    >
      <span class="app-name">{{ sender.name }}</span>
      ({{ sender.address }}) {{ $t('pages.accountListConfirm.websiteRequestConnect') }}
    </div>

    <div class="permissions">
      <template v-if="access.includes(POPUP_CONNECT_ADDRESS_PERMISSION)">
        <span class="title">
          <CheckMark class="icon" /> {{ $t('common.allAddresses') }}
        </span>
        <div class="description">
          <p>
            {{ $t('pages.accountListConfirm.addressesRequest') }}
          </p>
          <p class="color-warning">
            {{ $t('pages.accountListConfirm.message') }}
          </p>
        </div>
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
import { useStore } from 'vuex';
import type { IAccountOverview, IPermission } from '@/types';
import { RejectedByUserError } from '@/lib/errors';
import {
  PERMISSION_DEFAULTS,
  POPUP_CONNECT_ADDRESS_PERMISSION,
} from '@/config';
import { useState } from '../../../composables/vuex';
import { usePopupProps } from '../../../composables';

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
      ]),
    },
  },
  setup() {
    const store = useStore();

    const { popupProps, sender, setPopupProps } = usePopupProps();

    const permission = useState<IPermission>('permissions', popupProps.value?.app?.host);

    const appName = computed(() => permission.value?.name || popupProps.value?.app?.name);

    const recipient: IAccountOverview = {
      wallet: 'Superhero Wallet',
    };

    function confirm() {
      store.commit('permissions/addPermission', {
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
      sender,
      confirm,
      cancel,
      recipient,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables' as *;
@use '../../../styles/typography';

.account-list {
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

  .permissions {
    margin: 16px 0;

    .title {
      @extend %face-sans-15-medium;

      display: flex;
      align-items: center;
      padding-bottom: 4px;
      color: $color-grey-dark;

      .icon {
        width: 24px;
        height: 24px;
        color: $color-success;
        padding-right: 4px;
      }
    }

    .description {
      @extend %face-sans-15-regular;

      display: block;
      padding-bottom: 16px;
      color: $color-white;
      text-align: left;
    }
  }
}
</style>
