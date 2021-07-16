<template>
  <div
    :class="['notification-item', status]"
    @click="$emit('click')"
  >
    <div class="first-row">
      <img
        v-if="wallet"
        src="../../../icons/logo-small.svg"
      >
      <Avatar
        v-else
        :address="address"
      />
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
      <ActionsMenu @click.native.stop>
        <template slot="display">
          •••
        </template>
        <div
          class="mark-as-read"
          @click="$emit('toggle-read')"
        >
          {{
            status === 'read'
              ? $t('pages.notifications.markAsUnread')
              : $t('pages.notifications.markAsRead')
          }}
        </div>
      </ActionsMenu>
    </div>
    <div class="second-row">
      <span
        v-if="!wallet"
        class="notification-text"
      >
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
import Avatar from './Avatar';
import ActionsMenu from './ActionsMenu';

export default {
  components: {
    FormatDate,
    Avatar,
    ActionsMenu,
  },
  props: {
    address: { type: String, default: '' },
    name: { type: String, default: '' },
    text: { type: String, default: '' },
    to: { type: [String, Object, URL], required: true },
    wallet: { type: Boolean },
    status: {
      type: String,
      validator: (value) => ['created', 'peeked', 'read'].includes(value),
      default: 'created',
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.notification-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.9rem 1rem;
  margin-top: 0.1rem;
  font-size: 0.95rem;
  text-align: left;
  cursor: pointer;

  &.created,
  &.peeked {
    background-color: variables.$color-bg-2;

    .actions-menu,
    .format-date {
      color: variables.$color-blue;
    }
  }

  &.read {
    background-color: variables.$color-bg-1;

    .actions-menu,
    .format-date {
      color: variables.$color-dark-grey;
    }

    .actions-menu:hover {
      color: variables.$color-light-grey;
    }
  }

  .first-row {
    width: 100%;
    display: flex;
    justify-content: space-between;

    .avatar,
    img {
      overflow: inherit;
    }

    .address-and-menu {
      flex-grow: 1;
      margin-left: 5px;
      min-width: 0;
      overflow-wrap: break-word;

      .address {
        font-size: 0.55rem;
        color: variables.$color-white;

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
      word-break: break-word;
      color: variables.$color-white;
    }

    .format-date {
      flex-basis: 100px;
      text-align: right;
      align-self: flex-end;
      font-size: 0.75rem;
      white-space: nowrap;

      &.wallet {
        width: 100%;
        text-align: right;
        margin-top: -1.4rem;
      }
    }
  }

  .actions-menu {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: -3px;
    height: 30px;
    padding: 2px;
    font-size: 1.5rem;

    &.active {
      background-color: variables.$color-bg-3;
    }

    &:hover {
      box-sizing: border-box;
      border-radius: 50%;
      background-color: variables.$color-bg-3;
    }

    .mark-as-read {
      font-size: 0.9rem;
      line-height: 1.2rem;
      padding: 0.5rem;

      &:hover {
        color: variables.$color-white;
      }
    }
  }
}
</style>
