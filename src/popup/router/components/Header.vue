<template>
  <div class="header" v-if="showNavigation">
    <div class="content" :class="{ isLoggedIn }">
      <Arrow v-if="title" @click="goBack" />
      <Logo v-else />

      <div class="title">
        {{ title || 'Corona Wallet ' }}
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
    ...mapGetters(['isLoggedIn']),
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

  .content {
    height: 50px;
    max-width: 380px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: center;
    align-items: center;

    &:not(.isLoggedIn) .title {
      margin-left: 15px;
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
