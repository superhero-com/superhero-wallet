<template>
  <div class="popup">
    <Logo class="logo" />
    <p>
      {{ $t('pages.about.systemName') }}
      <span class="version">
        <a
          @click="
            openUrl(`https://github.com/aeternity/superhero-wallet/commit/${commitHash}`, true)
          "
        >
          {{ commitHash.slice(0, 7) }}</a
        ><!--eslint-disable-line vue-i18n/no-raw-text-->
        / {{ extensionVersion }}
      </span>
    </p>
    <hr />
    <div class="waellet-links">
      <router-link to="/about/termsOfService" data-cy="terms">{{
        $t('pages.about.terms')
      }}</router-link>
      <router-link to="/about/privacyPolicy" data-cy="privacy">{{
        $t('pages.about.privacyPolicy')
      }}</router-link>
      <Button @click="openUrl(bugReportUrl, true)">
        {{ $t('pages.about.reportBug') }}
      </Button>
    </div>
  </div>
</template>

<script>
import Button from '../components/Button';
import Logo from '../../../icons/logo.svg?vue-component';
import openUrl from '../../utils/openUrl';
import { BUG_REPORT_URL } from '../../utils/constants';

export default {
  components: { Button, Logo },
  data() {
    return {
      extensionVersion: `v.${process.env.npm_package_version}`,
      commitHash: process.env.COMMIT_HASH,
      bugReportUrl: BUG_REPORT_URL,
      openUrl,
    };
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
