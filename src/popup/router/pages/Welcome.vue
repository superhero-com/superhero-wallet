<template>
  <main>
    <div class="wrapper center">
      <Logo class="logo" />
      <p class="primary-title f-24">
        {{ $t('pages.welcome.send') }}
        <span class="secondary-text"> {{ $t('pages.appVUE.aeid') }} </span>
        {{ $t('pages.welcome.across') }}
      </p>
    </div>
    <Welcome class="welcome-bg" />
  </main>
</template>

<script>
import Logo from '../../../icons/logo.svg';
import Welcome from '../../../icons/welcome.svg';

export default {
  components: {
    Logo,
    Welcome,
  },
};
</script>
<style lang="scss">
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
