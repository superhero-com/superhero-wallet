<template>
  <ul class="sidebar-menu" @click="menuClickHandler" data-cy="sidebar-menu">
    <li class="menu-close">
      <Close @click="closeMenu" data-cy="close-menu" />
    </li>
    <li class="account-icon-holder">
      <div class="flex flex-align-center">
        <Avatar :address="account.publicKey" :name="account.name" />
        <div class="ml-8">
          <div class="f-14">{{ $t('mainAccount') }}</div>
          <div class="f-12" v-if="activeAccountName.includes('.chain')" data-cy="chain-name">
            {{ activeAccountName }}
          </div>
        </div>
      </div>
    </li>
    <li>
      <router-link to="/receive" data-cy="receive">
        {{ $t('pages.titles.topUp') }}
      </router-link>
    </li>
    <li>
      <router-link to="/send" data-cy="send">
        {{ $t('pages.titles.send') }}
      </router-link>
    </li>
    <li>
      <router-link to="/transactions" data-cy="transactions">
        {{ $t('pages.account.activity') }}
      </router-link>
    </li>
    <li>
      <button
        :class="showSettingsDropdown && 'opened'"
        @click="showSettingsDropdown = !showSettingsDropdown"
        data-cy="settings"
      >
        {{ $t('pages.titles.settings') }}
        <Arrow />
      </button>
      <transition name="slide">
        <ul v-if="showSettingsDropdown" data-cy="dropdown">
          <li>
            <router-link to="/settings/security" data-cy="security">
              {{ $t('pages.titles.security') }}
            </router-link>
          </li>
          <li>
            <router-link to="/settings/language" data-cy="language">
              {{ $t('pages.titles.language') }}
            </router-link>
          </li>
          <li>
            <router-link to="/settings/networks" data-cy="networks">
              {{ $t('pages.titles.networks') }}
            </router-link>
          </li>
          <li>
            <router-link :to="{ name: 'permissions-settings' }">
              {{ $t('pages.titles.permissionsSettings') }}
            </router-link>
          </li>
          <li>
            <span data-cy="remove-account" @click="removeAccount">
              {{ $t('pages.settings.tabRemoveAccount') }}
            </span>
          </li>
        </ul>
      </transition>
    </li>
    <li>
      <router-link to="/names" data-cy="names">
        {{ $t('pages.titles.names') }}
      </router-link>
    </li>
    <li>
      <router-link to="/invite" data-cy="invite">
        {{ $t('pages.titles.invite') }}
      </router-link>
    </li>
    <li>
      <router-link to="/about" data-cy="about">
        {{ $t('pages.about.heading') }}
      </router-link>
    </li>
  </ul>
</template>

<script>
import { mapGetters } from 'vuex';
import Close from '../../../icons/close.svg?vue-component';
import Arrow from '../../../icons/arrow-current-color.svg?vue-component';
import Avatar from './Avatar';

export default {
  components: { Close, Arrow, Avatar },
  computed: mapGetters(['account', 'activeAccountName']),
  data: () => ({ showSettingsDropdown: false }),
  methods: {
    menuClickHandler({ target }) {
      if (target.tagName === 'A') this.closeMenu();
    },
    closeMenu() {
      this.$emit('close');
    },
    async removeAccount() {
      await this.$store.dispatch('requestResetting');
      this.closeMenu();
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.sidebar-menu {
  position: fixed;
  min-width: 200px;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: $nav-bg-color;
  margin: 0;
  padding: 0;
  padding-top: env(safe-area-inset-top);
  list-style: none;

  li {
    margin: 0;
    border-bottom: 1px solid $bg-color;

    & > a,
    & > button,
    & > span {
      text-decoration: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 15px;
      line-height: 18px;
      width: 100%;
      color: $secondary-color;
      text-align: left;
      margin: 0;
      padding: 8px 1rem;
      white-space: nowrap;
      transition: background-color 0.2s;
      cursor: pointer;

      &.opened,
      &:hover {
        background-color: $secondary-color;
        color: $white-color;
      }

      &.opened svg {
        transform: rotate(90deg);
      }

      svg {
        width: 9px;
        vertical-align: middle;
      }
    }

    ul {
      list-style: none;
      background: $submenu-bg;
      padding: 0;
      max-height: 300px;
      overflow: hidden;

      &.slide-enter-active,
      &.slide-leave-active {
        transition: max-height 0.3s ease-in-out;
      }

      &.slide-enter,
      &.slide-leave-to {
        max-height: 0;
      }

      li > a,
      li > button,
      li > span {
        padding: 6px 1rem 6px 25px;
      }
    }

    .token-info {
      margin-right: auto;
      margin-left: 5px;
    }
  }

  .menu-close {
    padding: 10px;
    text-align: right;
    border-bottom: none;

    .ae-icon {
      font-size: 40px;
      cursor: pointer;
    }

    svg {
      cursor: pointer;
    }
  }

  .account-icon-holder {
    padding: 0.5rem 1rem 20px 1rem;
  }
}
</style>
