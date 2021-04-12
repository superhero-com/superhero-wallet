<template>
  <div class="about">
    <Logo class="logo" />
    <p>
      <span class="version">
        <a
          :href="`https://github.com/aeternity/superhero-wallet/commit/${commitHash}`"
          target="_blank"
        >
          {{ commitHash.slice(0, 7) }}</a>
        / {{ extensionVersion }}
      </span>
    </p>
    <hr>
    <div class="waellet-links">
      <router-link
        to="/about/termsOfService"
        data-cy="terms"
      >
        {{
          $t('pages.about.terms')
        }}
      </router-link>
      <router-link
        to="/about/privacyPolicy"
        data-cy="privacy"
      >
        {{
          $t('pages.about.privacyPolicy')
        }}
      </router-link>
      <Button :to="BUG_REPORT_URL">
        {{ $t('pages.about.reportBug') }}
      </Button>
    </div>
  </div>
</template>

<script>
import Button from '../components/Button';
import Logo from '../../../icons/logo.svg?vue-component';
import { BUG_REPORT_URL } from '../../utils/constants';

export default {
  components: { Button, Logo },
  data() {
    return {
      extensionVersion: `v.${process.env.npm_package_version}`,
      commitHash: process.env.COMMIT_HASH,
      BUG_REPORT_URL,
    };
  },
};
</script>

<style lang="scss" scoped>
.about {
  .logo {
    margin-top: 16px;
  }

  .version {
    color: #909090;
  }

  .waellet-links a {
    font-weight: bold;
    display: block;
  }
}
</style>
