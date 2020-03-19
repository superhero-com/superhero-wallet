<template>
  <main>
    <div class="wrapper center">
      <Logo class="logo" />
      <p class="f-24 primary-title">
        {{ $t('pages.welcome.send') }}
        <span class="secondary-text">{{ $t('pages.appVUE.aeid') }}</span>
        {{ $t('pages.welcome.across') }}
      </p>
    </div>
  </main>
</template>

<script>
import Logo from '../../../icons/logo.svg?vue-component';

export default {
  components: {
    Logo,
  },
};
</script>
<style lang="scss" scoped>
.welcome-bg {
  position: fixed;
  left: 50%;
  top: 65%;
  transform: translateX(-50%);
  -webkit-transform: translateX(-50%);
  -ms-transform: translateX(-50%);
  z-index: 0;
}
</style>
