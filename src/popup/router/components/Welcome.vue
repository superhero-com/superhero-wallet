<template>
  <div class="welcome center">
    <Logo class="logo" />
    <p class="f-24 primary-title">
      {{ $t('pages.welcome.send') }}
      <span class="secondary-text">{{ $t('ae') }}</span>
      {{ $t('pages.welcome.across') }}
    </p>
  </div>
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
.welcome {
  max-width: 357px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 1rem 18px 2rem 18px;
}
</style>
