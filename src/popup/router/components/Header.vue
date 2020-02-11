<template>
  <div>
    <div class="ae-header" :class="account.publicKey && isLoggedIn ? 'logged' + (aeppPopup ? ' aeppPopup' : '') : ''">
      <header class="flex " :class="isLoggedIn ? 'flex-justify-between' : 'flex-justify-content-start'">
        <div class="dropdown" v-if="!aeppPopup">
          <Arrow class="arrow-back mt-15" @click="goBack" v-if="title" />
          <Logo class="dropdown-button-icon mt-15" slot="button" v-else />
        </div>
        <div class="nav-title">
          <p v-if="title" class="flex flex-align-center">
            <span class="title-text"> {{ title }} </span>
          </p>
          <p v-else class="flex flex-align-center">
            <span class="title-text"> {{ $t('pages.appVUE.coronaWallet') }} </span>
          </p>
        </div>

        <div id="account" class="dropdown" v-if="account.publicKey && isLoggedIn && !aeppPopup">
          <Bell style="margin: 5px;" />
          <button class="acc-dropdown" v-on:click="toggleDropdown">
            <Hamburger class="dropdown-button-icon" style="padding-top:9px;" />
          </button>
          <transition name="slide">
            <SidebarMenu :dropdown="dropdown" :open="dropdown.account" @toggleMenu="toggleDropdown" @closeMenu="dropdown.account = false" />
          </transition>
        </div>
      </header>
    </div>
    <div class="menu-overlay" v-if="dropdown.account" @click="dropdown.account = false"></div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import SidebarMenu from './SidebarMenu';
import Arrow from '../../../icons/arrow.svg';
import Bell from '../../../icons/bell.svg';
import Hamburger from '../../../icons/hamburger.svg';
import Logo from '../../../icons/logo-small.svg';

export default {
  props: {
    title: String,
  },
  components: {
    SidebarMenu,
    Arrow,
    Bell,
    Hamburger,
    Logo,
  },
  data() {
    return {
      dropdown: {
        account: false,
        settings: false,
      },
    };
  },
  computed: {
    ...mapGetters(['account', 'isLoggedIn', 'aeppPopup']),
  },
  methods: {
    toggleDropdown(event, parentClass) {
      if (!this.aeppPopup) {
        if (typeof parentClass === 'undefined') {
          parentClass = '.dropdown';
        }
        const dropdownParent = event.target.closest(parentClass);
        this.dropdown[dropdownParent.id] = !this.dropdown[dropdownParent.id];
      }
    },
    goBack() {
      this.$router.push(this.isLoggedIn ? '/account' : '/');
    },
  },
};
</script>

<style lang="scss">
.ae-header header {
  padding: 0 10px;
}
</style>
