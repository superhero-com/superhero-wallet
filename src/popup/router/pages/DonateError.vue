<template>
  <div class="popup donate-error">
    <h1>{{ $t('pages.donate-error.error-report') }}</h1>
    <Textarea
      :placeholder="$t('pages.donate-error.error-placeholder')"
      size="medium"
      v-model="description"
    />
    <h1>{{ $t('pages.donate-error.data-collected') }}</h1>
    <h2 class="error-info-title">{{ $t('pages.donate-error.browser') }}</h2>
    <p class="error-info-content">{{ browser }}</p>
    <h2 class="error-info-title">{{ $t('pages.donate-error.details') }}</h2>
    <p class="error-info-content">{{ error.message }}</p>
    <p class="error-info-content">{{ error.stack }}</p>
    <Button dark inline to="/">{{ $t('pages.donate-error.cancel') }}</Button>
    <Button inline @click="donate">{{ $t('pages.donate-error.donate') }}</Button>
  </div>
</template>

<script>
import Textarea from '../components/Textarea';
import Button from '../components/Button';

export default {
  props: {
    entry: { type: Object, default: () => ({}) },
  },
  components: { Textarea, Button },
  data: () => ({ description: null }),
  computed: {
    browser() {
      const { name, os, version } = this.entry.browser || {};
      return `${name}, Version ${version} (${os})`;
    },
    error() {
      return this.entry.error;
    },
  },
  methods: {
    async donate() {
      try {
        await this.$store.dispatch('donateError', { ...this.entry, description: this.description });
        await this.$store.dispatch('modals/open', {
          name: 'default',
          ...this.$t('modals.donate-errors'),
        });
      } catch (e) {
        await this.$store.dispatch('modals/open', {
          name: 'default',
          ...this.$t('modals.donate-errors-error'),
        });
      } finally {
        this.$router.push('/account');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.donate-error {
  h1 {
    text-align: left;
    font-weight: normal;
    font-size: 16px;
    margin: 23px 0;
  }

  .error-info-title {
    text-transform: uppercase;
    color: #5b5c63;
    text-align: left;
    font-size: 14px;
    margin: 0 0 15px;
  }

  .error-info-content {
    color: $text-color;
    font-size: 15px;
    margin: 0;
    text-align: left;
    font-weight: normal;
    margin-bottom: 25px;
  }
}
</style>
