<template>
  <div
    class="notification-item"
    @click.stop="handleClick"
  >
    <div class="status-and-date">
      <span
        v-if="isUnread"
        class="unread-dot"
      />
      <span class="date">
        {{ createdAt }}
      </span>
    </div>
    <DefaultWalletNotificationIcon
      v-if="isWallet && !isSeedBackup"
      class="notification-icon"
    />
    <BackupSeedNotificationIcon
      v-else-if="isWallet && isSeedBackup"
      class="notification-icon-backup"
    />
    <Avatar
      v-else
      size="md"
      :address="address || title"
      :name="chainName"
      class="notification-avatar"
    />
    <div class="content">
      <AddressTruncated
        v-if="!chainName && address"
        :address="address"
        :protocol="PROTOCOLS.aeternity"
        class="address"
      />
      <Truncate
        v-else
        class="title"
        :str="title"
      />
      <div class="message">
        {{ message }}
      </div>
      <BtnMain
        v-if="isSeedBackup"
        :text="redirectInfo"
        class="redirect-button"
        variant="danger"
      />
      <div
        v-else-if="redirectInfo"
        class="external-link-button"
      >
        {{ redirectInfo }}
        <ExternalLinkIcon class="external-link-icon" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { INotification } from '@/types';
import { relativeTimeTo } from '@/utils';
import {
  IS_MOBILE_APP,
  IS_EXTENSION,
  IS_MOBILE_DEVICE,
  NOTIFICATION_STATUS_READ,
  NOTIFICATION_TYPES,
  PROTOCOLS,
} from '@/constants';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';

import Avatar from './Avatar.vue';
import AddressTruncated from './AddressTruncated.vue';
import Truncate from './Truncate.vue';
import BtnMain from './buttons/BtnMain.vue';
import ExternalLinkIcon from '../../icons/external-link.svg?vue-component';
import DefaultWalletNotificationIcon from '../../icons/default-wallet-notification.svg?vue-component';
import BackupSeedNotificationIcon from '../../icons/backup-seed-notification.svg?vue-component';

export default defineComponent({
  components: {
    BtnMain,
    AddressTruncated,
    Avatar,
    Truncate,
    ExternalLinkIcon,
    DefaultWalletNotificationIcon,
    BackupSeedNotificationIcon,
  },
  props: {
    notification: { type: Object as PropType<INotification>, required: true },
  },
  setup(props) {
    const router = useRouter();
    const { t } = useI18n();
    const { getName } = useAeNames();

    function getNotificationText(notification: INotification) {
      switch (notification.type) {
        case NOTIFICATION_TYPES.commentOnComment:
          return t('pages.notifications.commentOnComment');
        case NOTIFICATION_TYPES.commentOnTip:
          return t('pages.notifications.commentOnTip');
        case NOTIFICATION_TYPES.tipOnComment:
          return t('pages.notifications.tipOnComment');
        case NOTIFICATION_TYPES.retipOnTip:
          return t('pages.notifications.retipOnTip');
        case NOTIFICATION_TYPES.claimOfTip:
          return t('pages.notifications.claimOfTip');
        case NOTIFICATION_TYPES.claimOfRetip:
          return t('pages.notifications.claimOfRetip');
        case NOTIFICATION_TYPES.wallet:
          return notification.text;
        default:
          throw new Error(`Unknown notification status: ${notification.type}`);
      }
    }

    const chainName = getName(props.notification.sender || props.notification.receiver);

    const createdAt = computed(() => relativeTimeTo(props.notification.createdAt));
    const message = computed(() => getNotificationText(props.notification));
    const address = computed(() => props.notification.sender || props.notification.receiver);
    const isSeedBackup = computed(() => props.notification.isSeedBackup);
    const isWallet = computed(() => props.notification.type === NOTIFICATION_TYPES.wallet);
    const redirectInfo = computed(() => !isWallet.value ? t('pages.notifications.viewOnSuperhero') : props.notification.buttonLabel);
    const title = computed(() => isWallet.value
      ? props.notification.title || ''
      : chainName.value || address.value || t('common.fellowSuperhero'));
    const initialStatus = props.notification.status;
    const isUnread = computed(() => (IS_EXTENSION
      ? initialStatus
      : props.notification.status) !== NOTIFICATION_STATUS_READ);

    function handleClick(event: MouseEvent) {
      if (props.notification.path) {
        if (typeof props.notification.path === 'string' && /^\w+:\D+/.test(props.notification.path)) {
          if (IS_MOBILE_APP) {
            event.preventDefault();
            window.open(props.notification.path, '_system');
          } else {
            window.open(props.notification.path, '_blank');
          }
        } else {
          router.push(props.notification.path);
        }
      }
    }

    return {
      PROTOCOLS,
      IS_MOBILE_DEVICE,
      createdAt,
      message,
      chainName,
      address,
      title,
      isUnread,
      redirectInfo,
      isWallet,
      isSeedBackup,
      handleClick,
      initialStatus,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.notification-item {
  $left-column-width: 48px;

  padding: 8px 16px;
  display: grid;
  row-gap: 2px;
  grid-template-columns: $left-column-width  auto;
  border: none;
  outline: none;
  text-decoration: none;
  color: $color-white;
  cursor: pointer;

  &:hover {
    background-color: $color-bg-1-hover;
  }

  .content {
    overflow: hidden;
  }

  .status-and-date {
    @include mixins.flex(flex-start, center);

    grid-column-start: 2;
    gap: 4px;

    .unread-dot {
      $dot-size: 8px;

      width: $dot-size;
      height: $dot-size;
      border-radius: $dot-size;
      background-color: $color-danger;
    }

    .date {
      @extend %face-sans-12-regular;

      color: rgba($color-white, 0.5);
    }
  }

  .notification-avatar {
    margin-top: 6px;
    margin-left: 4px;
  }

  .notification-icon {
    margin-top: 3px;
    width: 40px;
    height: 40px;
  }

  .notification-icon-backup {
    margin-top: 12px;
    width: 40px;
    height: 40px;
  }

  .title {
    @extend %face-sans-15-medium;
  }

  .message {
    @extend %face-sans-13-regular;

    line-height: 20px;
    color: rgba($color-white, 0.85);

    &::first-letter {
      text-transform: uppercase;
    }
  }

  .address {
    @extend %face-mono-15-medium;

    letter-spacing: 0.07em;
  }

  .redirect-button {
    margin-top: 10px;
  }

  .external-link-button {
    @include mixins.flex(flex-start, center);

    @extend %face-sans-13-medium;

    color: $color-white;
    margin-top: 6px;

    .external-link-icon {
      width: 24px;
      height: 24px;
    }
  }
}
</style>
