<template>
  <ul class="sidebar-menu" @click="menuClickHandler" data-cy="sidebar-menu">
    <li class="menu-close">
      <Close @click="closeMenu" data-cy="close-menu" />
    </li>
    <li class="account-icon-holder">
      <div class="flex flex-align-center flex-justify-between">
        <UserAvatar :address="account.publicKey" />
        <div class="ml-8 mr-auto">
          <div class="f-14">{{ $t('pages.appVUE.mainAccount') }}</div>
          <div class="f-12" v-if="activeAccountName.includes('.chain')" data-cy="chain-name">{{ activeAccountName }}</div>
        </div>
      </div>
    </li>
    <li>
      <router-link to="/receive" data-cy="receive">
        {{ $t('pages.appVUE.topUp') }}
      </router-link>
    </li>
    <li>
      <router-link to="/send" data-cy="send">
        {{ $t('pages.appVUE.withdraw') }}
      </router-link>
    </li>
    <li>
      <router-link to="/transactions" data-cy="transactions">
        {{ $t('pages.appVUE.activity') }}
      </router-link>
    </li>
    <!-- <li>
      <router-link to="/account">
        {{ $t('pages.appVUE.profile') }}
      </router-link>
    </li> -->
    <li>
      <button :class="showSettingsDropdown && 'opened'" @click="showSettingsDropdown = !showSettingsDropdown" data-cy="settings">
        {{ $t('pages.appVUE.settings') }}
        <Arrow />
      </button>
      <transition name="slide">
        <ul v-if="showSettingsDropdown" data-cy="dropdown">
          <!-- <li>
            <router-link>
              {{ $t('pages.appVUE.general') }}
            </router-link>
          </li> -->
          <li>
            <router-link to="/securitySettings">
              {{ $t('pages.appVUE.security') }}
            </router-link>
          </li>
          <li>
            <router-link to="/securitySettings" data-cy="securitySettings">
              {{ $t('pages.appVUE.seedPhrase') }}
            </router-link>
          </li>
          <li>
            <router-link to="/generalSettings" data-cy="generalSettings">
              {{ $t('pages.appVUE.language') }}
            </router-link>
          </li>
          <li>
            <router-link to="/networks" data-cy="networks">
              {{ $t('pages.appVUE.networks') }}
            </router-link>
          </li>
        </ul>
      </transition>
    </li>
    <!-- <li>
      <router-link>
        {{ $t('pages.appVUE.advanced') }}
      </router-link>
    </li> -->
    <li>
      <router-link to="/names" data-cy="names">
        {{ $t('pages.appVUE.names') }}
      </router-link>
    </li>
    <li>
      <router-link to="/aboutSettings" data-cy="aboutSettings">
        {{ $t('pages.appVUE.help') }}
      </router-link>
    </li>

    <!-- <li>
      <router-link>
        {{ $t('pages.appVUE.versions') }}
      </router-link>
    </li> -->
  </ul>
</template>

<script>
import { mapGetters } from 'vuex';
import Close from '../../../icons/close.svg?vue-component';
import Arrow from '../../../icons/arrow-current-color.svg?vue-component';
import UserAvatar from './UserAvatar';

export default {
  components: { Close, Arrow, UserAvatar },
  computed: mapGetters(['account', 'activeAccountName']),
  data: () => ({ showSettingsDropdown: false }),
  methods: {
    menuClickHandler({ target }) {
      if (target.tagName === 'A') this.closeMenu();
    },
    closeMenu() {
      this.$emit('closeMenu');
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

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
    color: #717c87;
    margin: 0;
    border-bottom: 1px solid $bg-color;

    a,
    button {
      text-decoration: none;
      display: flex;
      justify-content: space-between;
      font-size: 15px;
      line-height: 18px;
      width: 100%;
      color: $accent-color;
      text-align: left;
      margin: 0;
      padding: 8px 1rem;
      white-space: nowrap;
      transition: background-color 0.2s;

      &.opened,
      &:hover {
        background-color: $accent-color;
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

      a,
      button {
        padding: 6px 1rem 6px 25px;
      }
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
