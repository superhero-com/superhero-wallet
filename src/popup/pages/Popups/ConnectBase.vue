<template>
  <Modal
    show
    full-screen
    class="connect"
    data-cy="popup-aex2"
    semi-dense
  >
    <p
      class="text-heading-4 text-center header"
      data-cy="page-header"
      v-text="$t('pages.connectConfirm.title')"
    />
    <p
      class="text-center"
      v-text="$t('pages.connectConfirm.subTitle')"
    />

    <div class="connect-parties">
      <p
        v-if="isUnknown"
        class="warning-message color-warning"
        v-text="$t('pages.connectConfirm.unknownOriginWarning')"
      />

      <!-- DAPP CARD -->
      <Card
        data-cy="aepp"
        :variant="(isUnknown) ? 'warning' : undefined"
        icon-centered
        dense
      >
        <template #icon>
          <Avatar size="rg" borderless>
            <img v-if="dappIcon" :src="dappIcon" class="dapp-logo" alt="DAPP logo" />
            <DappIcon v-else class="dapp-icon" />
          </Avatar>
        </template>

        <div class="aepp-data">
          <p
            class="text-heading-5"
            v-text="(isUnknown) ? $t('pages.connectConfirm.unknownSource') : dappNameToDisplay"
          />
          <Truncate :str="dappUrlToDisplay || $t('pages.connectConfirm.unknownUrl')" />
        </div>
      </Card>

      <div class="connect-parties-label">
        <div class="line">
          <TriangleRightIcon class="triangle" />
        </div>
        <p
          class="text-description text-center"
          v-text="$t('pages.connectConfirm.websiteRequestConnect')"
        />
      </div>

      <!-- USER CARD -->
      <AccountSelectOptionsItem
        v-if="activeAccount"
        :custom-account="activeAccount"
        hide-balance
        hide-protocol-icon
      />
      <Card v-else dense>
        <AnimatedSpinnerIcon class="spinner" />
      </Card>
    </div>

    <p
      class="text-description text-center permissions-header"
      v-text="$t('pages.connectConfirm.permissionsHeader')"
    />

    <div class="permissions">
      <div v-for="(accessName, index) in access" :key="index">
        <div class="label">
          <CheckMark class="icon" />
          {{ accessLabels[accessName]?.label || 'Unknown' }}
        </div>
        <div
          class="description"
          v-text="accessLabels[accessName]?.description"
        />
      </div>
    </div>

    <template #footer>
      <BtnMain
        variant="muted"
        data-cy="deny"
        extra-padded
        :text="$t('common.cancel')"
        @click="cancel()"
      />
      <BtnMain
        data-cy="accept"
        wide
        :text="$t('common.confirm')"
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
  PropType,
} from 'vue';
import { useI18n } from 'vue-i18n';
import type { ConnectPermission } from '@/types';
import { prepareUrlToDisplay } from '@/utils';
import { RejectedByUserError } from '@/lib/errors';
import {
  CONNECT_PERMISSIONS,
  PERMISSION_DEFAULTS,
  PROTOCOLS,
  TRUSTED_DAPPS,
} from '@/constants';
import { useAccounts, usePopupProps } from '@/composables';
import { usePermissions } from '@/composables/permissions';

import Card from '@/popup/components/Card.vue';
import Avatar from '@/popup/components/Avatar.vue';
import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import AccountSelectOptionsItem from '@/popup/components/AccountSelectOptionsItem.vue';
import Truncate from '@/popup/components/Truncate.vue';

import AnimatedSpinnerIcon from '@/icons/animated-spinner.svg?vue-component';
import CheckMark from '@/icons/check-mark-circle-outline.svg?vue-component';
import DappIcon from '@/icons/dapp.svg?vue-component';
import TriangleRightIcon from '@/icons/triangle-right.svg?vue-component';

export default defineComponent({
  components: {
    AccountSelectOptionsItem,
    Card,
    Avatar,
    Modal,
    BtnMain,
    Truncate,
    AnimatedSpinnerIcon,
    CheckMark,
    DappIcon,
    TriangleRightIcon,
  },
  props: {
    access: { type: Array as PropType<ConnectPermission[]>, required: true },
  },
  setup() {
    const { t } = useI18n();

    const { getLastActiveProtocolAccount } = useAccounts();
    const { popupProps, sender, setPopupProps } = usePopupProps();
    const { permissions, addPermission } = usePermissions();

    const accessLabels: Record<ConnectPermission, any> = {
      [CONNECT_PERMISSIONS.address]: {
        label: t('pages.connectConfirm.addressLabel'),
        description: t('pages.connectConfirm.addressRequest'),
      },
      [CONNECT_PERMISSIONS.addressList]: {
        label: t('pages.connectConfirm.addressListLabel'),
        description: t('pages.connectConfirm.addressListRequest'),
      },
      [CONNECT_PERMISSIONS.transactions]: {
        label: t('pages.connectConfirm.transactionLabel'),
        description: t('pages.connectConfirm.transactionRequest'),
      },
    };

    const activeAccount = computed(() => getLastActiveProtocolAccount(
      popupProps.value?.protocol || PROTOCOLS.aeternity,
    ));

    const permission = computed(() => {
      const host = popupProps.value?.app?.host;
      return (host) ? permissions.value[host] : undefined;
    });

    const trustedDapp = computed(() => {
      const urlWithNoProtocol = prepareUrlToDisplay(popupProps.value?.app?.url);
      return (urlWithNoProtocol)
        ? TRUSTED_DAPPS.find(({ url }) => urlWithNoProtocol.startsWith(prepareUrlToDisplay(url)!))
        : undefined;
    });

    const dappNameToDisplay = computed(
      () => permission.value?.name || trustedDapp.value?.name || popupProps.value?.app?.name || t('common.dapp'),
    );

    const dappUrlToDisplay = computed(
      () => prepareUrlToDisplay(popupProps.value?.app?.url),
    );

    const dappIcon = computed(
      () => (trustedDapp.value)
        // eslint-disable-next-line global-require, import/no-dynamic-require
        ? require(`@/icons/dapp/${trustedDapp.value.image}`)
        : null,
    );

    /**
     * In case we don't have the access to dapp url and name we need to inform user
     * about possible danger.
     */
    const isUnknown = computed(() => !popupProps.value?.app?.url && !popupProps.value?.app?.name);

    function confirm() {
      if (popupProps.value?.app?.host) {
        addPermission({
          ...PERMISSION_DEFAULTS,
          ...popupProps.value?.app,
          ...permission.value,
          name: permission.value?.name || popupProps.value.app.name || popupProps.value.app.host,
        });
      }
      popupProps.value?.resolve();
    }

    function cancel() {
      popupProps.value?.reject(new RejectedByUserError());
    }

    onUnmounted(() => {
      setPopupProps(null);
    });

    return {
      popupProps,
      activeAccount,
      dappIcon,
      sender,
      trustedDapp,
      dappNameToDisplay,
      dappUrlToDisplay,
      accessLabels,
      isUnknown,
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
  .header {
    margin-top: 12px;
  }

  .dapp-logo {
    width: 28px;
  }

  .dapp-icon {
    width: 24px;
    opacity: 0.75;
  }

  .connect-parties {
    margin-top: 16px;

    .warning-message {
      margin-block: 0 16px;
    }

    .aepp-data {
      width: 100%;

      > * {
        line-height: 1.4em;
      }
    }

    .connect-parties-label {
      $arrow-space: 35px;

      position: relative;
      padding: 16px $arrow-space;

      .line {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        width: $arrow-space;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          right: 7px;
          width: 2px;
          background-color: $color-grey-border;
        }

        .triangle {
          color: $color-grey-border;
          transform: translateY(2px) rotate(90deg);
          width: 16px;
        }
      }
    }

    .spinner {
      display: block;
      width: 40px;
      margin: -5px auto;
    }
  }

  .permissions-header {
    margin-block: 16px;
  }

  .permissions {
    .label {
      @extend %face-sans-15-medium;

      display: flex;
      align-items: center;
      padding-bottom: 4px;
      color: $color-white;

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
      opacity: .85;
    }
  }
}
</style>
