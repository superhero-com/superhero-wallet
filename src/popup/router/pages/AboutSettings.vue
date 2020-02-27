<template>
  <div class="popup">
    <Logo class="logo" />
    <p>
      {{ $t('pages.aboutSettings.systemName') }}
      <span class="extensionVersion extensionVersionTop">{{ extensionVersion }}</span>
    </p>
    <hr />
    <div class="waellet-links">
      <a href="#" @click="goToTermsOfService">{{ $t('pages.aboutSettings.terms') }}</a>
      <a href="#" @click="goToPrivacyPolicy">{{ $t('pages.aboutSettings.privacyPolicy') }}</a>
      <Button :style="styling" @click="bugReport">
        {{ $t('pages.appVUE.reportBug') }}
      </Button>
    </div>
    <div v-if="loading" class="loading">
      <ae-loader />
    </div>
  </div>
</template>

<script>
import Logo from '../../../icons/logo.svg';

export default {
  components: {
    Logo,
  },
  data() {
    return {
      loading: false,
      bugReportURL: 'https://coronawallet.typeform.com/to/U3RroS',
      extensionVersion: `v.${process.env.npm_package_version}`,
    };
  },
  methods: {
    bugReport() {
      browser.tabs.create({ url: this.bugReportURL, active: true });
    },
    navigateToSettings() {
      this.$router.push('/settings');
    },
    goToTermsOfService() {
      this.$router.push('/termsOfService');
    },
    goToPrivacyPolicy() {
      this.$router.push('/privacyPolicy');
    },
  },
};
</script>

<style lang="scss">
.backbtn {
  width: 50%;
  margin-top: 5px;
}
.waellet-links a {
  font-weight: bold;
  display: block;
}
</style>
