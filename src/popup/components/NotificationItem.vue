<template>
  <div
    class="notification-item"
    @click.stop="handleClick"
  >
    <div class="status-and-date ">
      <span
        v-if="isUnread"
        class="unread-dot"
      />
      <span class="date">
        {{ createdAt }}
      </span>
    </div>
    <Avatar
      v-if="hasIncomingTransaction"
      size="md"
      :address="notification.receiver"
      class="notification-avatar"
      with-border
    />
    <DefaultWalletNotificationIcon
      v-else-if="isWallet && !isSeedBackup"
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
      with-border
    />
    <div class="content">
      <AddressTruncated
        v-if="!chainName && address && !hasIncomingTransaction"
        :address="address"
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
        <ExternalLinkIcon
          v-if="!hasIncomingTransaction"
          class="external-link-icon"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  NOTIFICATION_STATUS_READ,
  NOTIFICATION_TYPE_CLAIM_OF_RETIP,
  NOTIFICATION_TYPE_CLAIM_OF_TIP,
  NOTIFICATION_TYPE_COMMENT_ON_COMMENT,
  NOTIFICATION_TYPE_COMMENT_ON_TIP,
  NOTIFICATION_TYPE_RETIP_ON_TIP,
  NOTIFICATION_TYPE_TIP_ON_COMMENT,
  NOTIFICATION_TYPE_WALLET,
  relativeTimeTo,
} from '../utils';
import { IS_EXTENSION, IS_MOBILE_DEVICE } from '../../lib/environment';
import { INotification } from '../../types';
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

    function getNotificationText(notification: INotification) {
      switch (notification.type) {
        case NOTIFICATION_TYPE_COMMENT_ON_COMMENT:
          return t('pages.notifications.commentOnComment');
        case NOTIFICATION_TYPE_COMMENT_ON_TIP:
          return t('pages.notifications.commentOnTip');
        case NOTIFICATION_TYPE_TIP_ON_COMMENT:
          return t('pages.notifications.tipOnComment');
        case NOTIFICATION_TYPE_RETIP_ON_TIP:
          return t('pages.notifications.retipOnTip');
        case NOTIFICATION_TYPE_CLAIM_OF_TIP:
          return t('pages.notifications.claimOfTip');
        case NOTIFICATION_TYPE_CLAIM_OF_RETIP:
          return t('pages.notifications.claimOfRetip');
        case NOTIFICATION_TYPE_WALLET:
          return notification.text;
        default:
          throw new Error(`Unknown notification status: ${notification.type}`);
      }
    }

    const createdAt = computed(() => relativeTimeTo(props.notification.createdAt));
    const message = computed(() => getNotificationText(props.notification));
    const chainName = computed(
      () => props.notification.senderName || props.notification.receiverName,
    );
    const address = computed(() => props.notification.sender || props.notification.receiver);
    const isSeedBackup = computed(() => props.notification.isSeedBackup);
    const hasIncomingTransaction = computed(() => props.notification.hasIncomingTransaction);
    const isWallet = computed(() => props.notification.type === NOTIFICATION_TYPE_WALLET);
    const redirectInfo = computed(() => !isWallet.value ? t('pages.notifications.viewOnSuperhero') : props.notification.buttonLabel);
    const title = computed(() => isWallet.value
      ? props.notification.title || ''
      : chainName.value || address.value || t('common.fellowSuperhero'));
    const initialStatus = props.notification.status;
    const isUnread = computed(() => (IS_EXTENSION
      ? initialStatus
      : props.notification.status) !== NOTIFICATION_STATUS_READ);

    function handleClick() {
      if (props.notification.path) {
        // check if path starts with # or protocol
        if (typeof props.notification.path === 'string' && /^(#|\w+:\D+)/.test(props.notification.path)) {
          window.open(props.notification.path, props.notification.path.startsWith('#') ? '_self' : '_blank');
        } else {
          router.push(props.notification.path);
        }
      }
    }

    return {
      createdAt,
      message,
      chainName,
      address,
      title,
      isUnread,
      redirectInfo,
      isWallet,
      isSeedBackup,
      hasIncomingTransaction,
      handleClick,
      IS_MOBILE_DEVICE,
      initialStatus,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.notification-item {
  $left-column-width: 48px;

  padding: 8px 16px;
  display: grid;
  row-gap: 2px;
  grid-template-columns: $left-column-width  auto;
  border: none;
  outline: none;
  text-decoration: none;
  color: variables.$color-white;
  cursor: pointer;

  &:hover {
    background-color: variables.$color-bg-1-hover;
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
      background-color: variables.$color-danger;
    }

    .date {
      color: rgba(variables.$color-white, 0.5);

      @extend %face-sans-12-regular;
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
    color: rgba(variables.$color-white, 0.85);

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

    color: white;
    margin-top: 6px;

    .external-link-icon {
      width: 24px;
      height: 24px;
    }
  }
}
</style>
