<template>
  <div class="notification-item" @click="$emit('click', $event)">
    <div class="first-row">
      <img v-if="wallet" src="../../../icons/logo-small.svg" />
      <UserAvatar v-else :address="address" />
      <div class="address-and-menu">
        <span @click.stop>
          <slot />
        </span>
        <span v-if="!wallet">
          {{ name }}
        </span>
        <span :class="['address', { wallet }]">
          {{ wallet ? text : address }}
        </span>
      </div>
    </div>
    <div class="second-row">
      <span v-if="!wallet" class="notification-text">
        {{ text }}
      </span>
      <span :class="['format-date', { wallet }]">
        <FormatDate v-bind="$attrs" />
      </span>
    </div>
  </div>
</template>

<script>
import FormatDate from './FormatDate';
import UserAvatar from './UserAvatar';

export default {
  components: {
    FormatDate,
    UserAvatar,
  },
  props: {
    address: { type: String, default: '' },
    name: { type: String, default: '' },
    text: { type: String, default: '' },
    to: { type: [String, Object, URL], required: true },
    wallet: { type: Boolean },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.notification-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 1rem 0.9rem 1rem;

  .first-row {
    width: 100%;
    display: flex;

    .user-avatar,
    .user-identicon,
    img {
      overflow: inherit;
    }

    .address-and-menu {
      margin-left: 0.5rem;
      width: 100%;
      display: flex;
      flex-direction: column;

      .address {
        font-size: 0.55rem;
        color: $text-color;

        &.wallet {
          font-size: inherit;
          margin-right: 4rem;
          word-break: break-word;
        }
      }
    }
  }

  .second-row {
    margin-top: 0.25rem;
    width: 100%;
    display: flex;
    justify-content: space-between;

    .notification-text {
      color: $text-color;
    }

    .format-date {
      color: #727278;
      font-size: 0.75rem;

      &.wallet {
        width: 100%;
        text-align: right;
        margin-top: -1.4rem;
      }
    }
  }
}
</style>
