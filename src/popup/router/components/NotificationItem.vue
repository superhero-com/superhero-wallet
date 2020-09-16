<template>
  <div class="notification-item">
    <div @click="$emit('click', $event)">
      <UserAvatar v-if="!wallet" :address="address" />
      <img v-else-if="wallet" src="../../../icons/logo-small.svg" />
      <div class="author-name">
        <span v-if="name" class="chain-name" :class="{ wallet }">
          {{ name }}
        </span>
        <span class="notification-text">
          {{ text }}
        </span>
      </div>
    </div>
    <span class="right">
      <FormatDate v-bind="$attrs" />
      <slot />
    </span>
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
  align-items: center;
  color: $gray-2;
  display: flex;
  font-size: 0.8rem;
  justify-content: space-between;
  padding: 0 1rem 0.9rem 1rem;

  .right {
    min-width: 4.5rem;
    font-size: 0.8rem;
    display: flex;
    align-items: flex-end;
    flex-direction: column-reverse;
  }

  .notification-text,
  .chain-name {
    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    word-break: break-word;
  }

  .chain-name:not(.wallet),
  .chain-name:not(.wallet) .notification-text {
    white-space: nowrap;
  }

  .user-avatar,
  .user-identicon,
  img {
    margin-right: 0.25rem;
  }

  > div {
    text-decoration: none;
    color: $text-color;
    display: flex;
    margin-right: 1.3rem;
    overflow: hidden;
  }

  .chain-name:not(.wallet) {
    color: #fff;
  }

  .author-name {
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  }
}
</style>
