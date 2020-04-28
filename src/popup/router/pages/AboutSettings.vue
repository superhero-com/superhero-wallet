<template>
  <div class="popup">
    <Logo class="logo" />
    <p>
      {{ $t('pages.aboutSettings.systemName') }}
      <span class="version">{{ extensionVersion }}</span>
    </p>
    <hr />
    <div class="waellet-links">
      <router-link to="/termsOfService" data-cy="terms">{{
        $t('pages.aboutSettings.terms')
      }}</router-link>
      <router-link to="/privacyPolicy" data-cy="privacy">{{
        $t('pages.aboutSettings.privacyPolicy')
      }}</router-link>
      <Button @click="bugReport">
        {{ $t('pages.appVUE.reportBug') }}
      </Button>

      <Button @click="donateErrors">
        {{ $t('pages.appVUE.donateErrorReports') }}
      </Button>
    </div>
  </div>
</template>

<script>
import Logo from '../../../icons/logo.svg?vue-component';
import openUrl from '../../utils/openUrl';
import Logger from '../../../lib/logger';

export default {
  components: {
    Logo,
  },
  data() {
    return {
      bugReportURL: 'https://thesuperherowallet.typeform.com/to/vh8Ffu',
      extensionVersion: `v.${process.env.npm_package_version}`,
    };
  },
  methods: {
    bugReport() {
      openUrl(this.bugReportURL);
    },
    async donateErrors() {
      Logger.sendLog();
    },
  },
};
</script>

<style lang="scss" scoped>
.version {
  color: #909090;
}

.waellet-links a {
  font-weight: bold;
  display: block;
}
</style>
