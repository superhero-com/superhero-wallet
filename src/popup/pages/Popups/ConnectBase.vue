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
        v-if="isUnknownDapp"
        class="warning-message color-warning"
        v-text="$t('pages.connectConfirm.unknownOriginWarning')"
      />

      <!-- DAPP CARD -->
      <Card
        data-cy="aepp"
        :variant="(isUnknownDapp) ? 'warning' : undefined"
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
            v-text="(isUnknownDapp) ? $t('pages.connectConfirm.unknownSource') : dappNameToDisplay"
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
      <template v-if="activeAccount">
        <!-- USER CARD -->
        <AccountSelectOptionsItem
          :custom-account="activeAccount"
          hide-balance
          hide-protocol-icon
        >
          <template #right>
            <NetworkButton
              variant="outlined"
              class="network-button"
            />
          </template>
        </AccountSelectOptionsItem>

        <p
          class="text-description text-center permissions-header"
          v-text="$t('pages.connectConfirm.permissionsHeader')"
        />

        <div class="permissions">
          <div v-for="(accessName, index) in accessList" :key="index">
            <div class="label">
              <CheckMark class="icon" />
              {{ accessLabels[accessName]?.label || 'Unknown' }}
            </div>
            <TemplateRenderer
              class="description"
              :str="accessLabels[accessName]?.description"
            />
          </div>
        </div>

        <div>
          <CheckBox
            v-model="rememberMe"
            class="remember-me"
            data-cy="checkbox"
          >
            {{ $t('pages.connectConfirm.rememberMe') }}
          </CheckBox>
        </div>
      </template>
      <template v-else>
        <Card class="skeleton-card">
          <ion-skeleton-text
            class="avatar"
            animated
          />
          <div class="name-and-address">
            <ion-skeleton-text
              class="name"
              animated
            />
            <ion-skeleton-text
              class="address"
              animated
            />
          </div>
        </Card>
        <InfoBox
          class="danger"
          type="danger"
        >
          <div
            class="label"
            v-text="$t('pages.connectConfirm.noAccountsFoundLabel', [protocolName])"
          />
          <span v-text="$t('pages.connectConfirm.noAccountsFoundDescription', [protocolName])" />
        </InfoBox>
      </template>
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
        :disabled="!activeAccount"
        :text="$t('common.confirm')"
        @click="confirm()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { IonSkeletonText } from '@ionic/vue';
import {
  computed,
  defineComponent,
  onUnmounted,
  PropType,
  ref,
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
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import Card from '@/popup/components/Card.vue';
import Avatar from '@/popup/components/Avatar.vue';
import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import AccountSelectOptionsItem from '@/popup/components/AccountSelectOptionsItem.vue';
import InfoBox from '@/popup/components/InfoBox.vue';
import NetworkButton from '@/popup/components/NetworkButton.vue';
import TemplateRenderer from '@/popup/components/TemplateRenderer.vue';
import Truncate from '@/popup/components/Truncate.vue';
import CheckBox from '@/popup/components/CheckBox.vue';

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
    InfoBox,
    IonSkeletonText,
    NetworkButton,
    TemplateRenderer,
    Truncate,
    CheckMark,
    CheckBox,
    DappIcon,
    TriangleRightIcon,
  },
  props: {
    access: { type: Array as PropType<ConnectPermission[]>, required: true },
  },
  setup(props) {
    const { t } = useI18n();
    const rememberMe = ref(true);

    const { getLastActiveProtocolAccount } = useAccounts();
    const {
      isUnknownDapp,
      popupProps,
      sender,
      setPopupProps,
    } = usePopupProps();
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
      [CONNECT_PERMISSIONS.networks]: {
        label: t('pages.connectConfirm.networkLabel'),
        description: t('pages.connectConfirm.networkRequest'),
      },
      [CONNECT_PERMISSIONS.transactions]: {
        label: t('pages.connectConfirm.transactionLabel'),
        description: t('pages.connectConfirm.transactionRequest'),
      },
    };

    // @ts-expect-error
    const accessList = computed<ConnectPermission[]>(() => popupProps.value?.access
      || props.access);

    const protocol = computed(() => popupProps.value?.protocol || PROTOCOLS.aeternity);

    const activeAccount = computed(() => getLastActiveProtocolAccount(protocol.value));

    const permission = computed(() => {
      const host = popupProps.value?.app?.host;
      return (host) ? permissions.value[host] : undefined;
    });

    const trustedDapp = computed(() => {
      const urlWithNoProtocol = prepareUrlToDisplay(popupProps.value?.app?.href);
      return (urlWithNoProtocol)
        ? TRUSTED_DAPPS.find(({ url }) => urlWithNoProtocol.startsWith(prepareUrlToDisplay(url)!))
        : undefined;
    });

    const dappNameToDisplay = computed(
      () => permission.value?.name || trustedDapp.value?.name || popupProps.value?.app?.name || t('common.dapp'),
    );

    const dappUrlToDisplay = computed(
      () => prepareUrlToDisplay(popupProps.value?.app?.href),
    );

    const dappIcon = computed(
      () => (trustedDapp.value)
        // eslint-disable-next-line global-require, import/no-dynamic-require
        ? require(`@/icons/dapp/${trustedDapp.value.image}`)
        : null,
    );

    const protocolName = computed(
      () => ProtocolAdapterFactory.getAdapter(protocol.value).protocolName,
    );

    function confirm() {
      if (popupProps.value?.app?.host) {
        /**
         * TODO: When a user disconnects, set the `rememberMe` permission to false
         * Currently, disconnecting through the dapp does not call the appropriate
         * `onDisconnect` method, seems to be an issue with the SDK
         * */
        addPermission({
          ...PERMISSION_DEFAULTS,
          ...popupProps.value?.app,
          ...permission.value,
          name: permission.value?.name || popupProps.value.app.name || popupProps.value.app.host,
          address: rememberMe.value,
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
      rememberMe,
      accessList,
      popupProps,
      activeAccount,
      dappIcon,
      sender,
      trustedDapp,
      dappNameToDisplay,
      dappUrlToDisplay,
      accessLabels,
      isUnknownDapp,
      protocolName,
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

    .network-button {
      pointer-events: none;
    }

    .danger {
      margin-top: 24px;

      .label {
        @extend %face-sans-15-medium;

        margin-bottom: 8px;
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

    .skeleton-card {
      padding: 8px 8px;

      &:deep(.card-content) {
        display: flex;
      }

      .name-and-address {
        display: flex;
        flex-direction: column;
        margin-left: 8px;
        gap: 8px;
        margin-top: 4px;
      }

      ion-skeleton-text {
        --background: rgba(#{$color-white-rgb}, 0.1);
        --background-rgb: #{$color-white-rgb};
        margin: 0;

        &.name {
          height: 12px;
          width: 152px;
          border-radius: 8px;
        }

        &.address {
          height: 12px;
          width: 96px;
          border-radius: 8px;
        }

        &.avatar {
          --border-radius: 25px;
          height: 40px;
          width: 40px;
        }
      }
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

  .remember-me {
    @extend %face-sans-15-medium;
  }
}
</style>
