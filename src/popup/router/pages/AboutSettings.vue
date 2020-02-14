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
      logo: browser.runtime.getURL('../../../icons/icon_128.png'),
      loading: false,
      bugReportURL: 'https://coronawallet.typeform.com/to/U3RroS',
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
  computed: {
    extensionVersion() {
      return `v.${browser.runtime.getManifest().version}`;
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
