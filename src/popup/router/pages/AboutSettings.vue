<template>
  <div class="popup">
    <Logo class="logo" />
    <p>
      {{ $t('pages.aboutSettings.systemName') }}
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
      <router-link to="/termsOfService" data-cy="terms">{{
        $t('pages.aboutSettings.terms')
      }}</router-link>
      <router-link to="/privacyPolicy" data-cy="privacy">{{
        $t('pages.aboutSettings.privacyPolicy')
      }}</router-link>
      <Button @click="openUrl('https://thesuperherowallet.typeform.com/to/vh8Ffu', true)">
        {{ $t('pages.appVUE.reportBug') }}
      </Button>
    </div>
  </div>
</template>

<script>
import Logo from '../../../icons/logo.svg?vue-component';
import openUrl from '../../utils/openUrl';

export default {
  components: {
    Logo,
  },
  data() {
    return {
      extensionVersion: `v.${process.env.npm_package_version}`,
      commitHash: process.env.COMMIT_HASH,
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
