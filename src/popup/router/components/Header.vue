<template>
  <div class="header" v-if="showNavigation && !aeppPopup">
    <div class="content" :class="{ isLoggedIn }">
      <Arrow v-if="title" @click="goBack" class="back-arrow" />
      <Logo v-else />

      <div class="title">
        <span v-if="title">{{ $t(`pages.titles.${title}`) }}</span>
        <span v-else>{{ $t('pages.appVUE.coronaWallet') }}</span>
      </div>

      <div v-if="isLoggedIn">
        <Bell />
        <button @click="$emit('toggle-sidebar')">
          <Hamburger />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Arrow from '../../../icons/arrow.svg';
import Bell from '../../../icons/bell.svg';
import Hamburger from '../../../icons/hamburger.svg';
import Logo from '../../../icons/logo-small.svg';

export default {
  components: { Arrow, Bell, Hamburger, Logo },
  computed: {
    ...mapGetters(['isLoggedIn', 'aeppPopup']),
    title() {
      return this.$route.meta.title;
    },
    showNavigation() {
      return this.$route.meta.navigation !== undefined ? this.$route.meta.navigation : true;
    },
  },
  methods: {
    goBack() {
      this.$router.push(this.isLoggedIn ? '/account' : '/');
    },
  },
};
</script>

<style lang="scss" scoped>
.header {
  padding-top: env(safe-area-inset-top);
  background-color: #21212a;
  border-bottom: 3px solid #3a3a47;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 8;

  .content {
    height: 50px;
    max-width: 380px;
    margin: 0 auto;
    padding: 0 10px;
    display: flex;
    justify-content: center;
    align-items: center;

    &:not(.isLoggedIn) .title {
      margin-left: auto;
      margin-right: auto;
    }

    .back-arrow {
      cursor: pointer;
    }

    &.isLoggedIn {
      justify-content: space-between;
      position: relative;

      > :not(.title) {
        z-index: 1;
      }

      .title {
        position: absolute;
        left: 0;
        right: 0;
        text-align: center;
      }
    }

    svg {
      vertical-align: middle;
    }

    button {
      padding: 0;
      margin-left: 5px;
    }
  }
}
</style>
