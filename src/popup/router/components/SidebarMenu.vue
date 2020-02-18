<template>
  <ul class="sidebar-menu">
    <li class="menu-close">
      <Close @click="closeMenu" />
    </li>
    <li class="account-icon-holder">
      <div class="flex flex-align-center flex-justify-between">
        <ae-identicon class="account-icon" :address="account.publicKey" size="base" />
        <div class="ml-8 mr-auto">
          <div class="f-14">{{ $t('pages.appVUE.mainAccount') }}</div>
          <div class="f-12" v-if="activeAccountName.includes('.chain')">{{ activeAccountName }}</div>
        </div>
      </div>
    </li>
    <li>
      <router-link to="/receive">
        {{ $t('pages.appVUE.topUp') }}
      </router-link>
    </li>
    <li>
      <router-link to="/send">
        {{ $t('pages.appVUE.withdraw') }}
      </router-link>
    </li>
    <li>
      <router-link to="/transactions">
        {{ $t('pages.appVUE.activity') }}
      </router-link>
    </li>
    <!-- <li>
      <router-link to="/account">
        {{ $t('pages.appVUE.profile') }}
      </router-link>
    </li> -->
    <li>
      <button :class="showSettingsDropdown && 'opened'" @click="showSettingsDropdown = !showSettingsDropdown">
        {{ $t('pages.appVUE.settings') }}
        <Arrow />
      </button>
      <transition name="slide">
        <ul v-if="showSettingsDropdown">
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
            <router-link to="/securitySettings">
              {{ $t('pages.appVUE.seedPhrase') }}
            </router-link>
          </li>
          <li>
            <router-link to="/generalSettings">
              {{ $t('pages.appVUE.language') }}
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
      <router-link to="/aboutSettings">
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
import Close from '../../../icons/close.svg';
import Arrow from '../../../icons/arrow-current-color.svg';

export default {
  components: { Close, Arrow },
  computed: mapGetters(['account', 'activeAccountName']),
  data: () => ({ showSettingsDropdown: false }),
  methods: {
    closeMenu() {
      this.$emit('closeMenu');
    },
  },
  watch: {
    $route() {
      this.closeMenu();
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

    .account-icon {
      width: 38px;
      height: 38px;
      border: 0.125rem solid transparent;
      -webkit-box-shadow: 0 0 0 2px $secondary-color;
      box-shadow: 0 0 0 2px $secondary-color;
    }
  }
}
</style>
