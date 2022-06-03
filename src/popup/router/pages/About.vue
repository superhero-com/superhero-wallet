<template>
  <div class="about">
    <Logo class="logo" />
    <p>
      <span class="version">
        commit
        <a
          :href="`${COMMIT_URL}${commitHash}`"
          target="_blank"
        >
          {{ commitHash.slice(0, 7) }}</a>
        / {{ extensionVersion }}
      </span>
    </p>
    <hr>
    <div class="waellet-links">
      <a
        :href="`${AGGREGATOR_URL}faq`"
        target="_blank"
      >FAQ</a>
      <router-link
        to="/about/termsOfService"
        data-cy="terms"
      >
        {{ $t('pages.about.terms') }}
      </router-link>
      <router-link
        to="/about/privacyPolicy"
        data-cy="privacy"
      >
        {{ $t('pages.about.privacyPolicy') }}
      </router-link>
      <Button :to="BUG_REPORT_URL">
        {{ $t('pages.about.reportBug') }}
      </Button>
    </div>
  </div>
</template>

<script>
import Button from '../components/Button.vue';
import Logo from '../../../icons/logo.svg?vue-component';
import { BUG_REPORT_URL, AGGREGATOR_URL, COMMIT_URL } from '../../utils/constants';

export default {
  components: { Button, Logo },
  data() {
    return {
      extensionVersion: `v.${process.env.npm_package_version}`,
      commitHash: process.env.COMMIT_HASH,
      BUG_REPORT_URL,
      AGGREGATOR_URL,
      COMMIT_URL,
    };
  },
};
</script>

<style lang="scss" scoped>
@use "../../../styles/variables";

.about {
  .logo {
    margin-top: 16px;
  }

  .version {
    color: variables.$color-dark-grey;
  }

  .waellet-links a {
    font-weight: bold;
    display: block;
  }
}
</style>
