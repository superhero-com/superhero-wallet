<template>
  <div class="donate-error">
    <h1>{{ $t('pages.donate-error.error-report') }}</h1>
    <FormTextarea
      v-model="description"
      :placeholder="$t('pages.donate-error.error-placeholder')"
      size="md"
    />
    <h1>{{ $t('pages.donate-error.data-collected') }}</h1>
    <h2 class="error-info-title">
      {{ $t('pages.donate-error.browser') }}
    </h2>
    <p class="error-info-content">
      {{ browser }}
    </p>
    <h2 class="error-info-title">
      {{ $t('pages.donate-error.details') }}
    </h2>
    <p class="error-info-content">
      {{ error.message }}
    </p>
    <p class="error-info-content">
      {{ error.stack }}
    </p>
    <BtnMain
      variant="muted"
      inline
      extra-padded
      to="/"
    >
      {{ $t('common.cancel') }}
    </BtnMain>
    <BtnMain
      inline
      @click="donate"
    >
      {{ $t('pages.donate-error.donate') }}
    </BtnMain>
  </div>
</template>

<script>
import { useAeTippingBackend } from '@/protocols/aeternity/composables';
import { useModals } from '../../composables';
import FormTextarea from '../components/form/FormTextarea.vue';
import BtnMain from '../components/buttons/BtnMain.vue';

export default {
  components: {
    FormTextarea,
    BtnMain,
  },
  props: {
    entry: { type: Object, default: () => ({}) },
  },
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
      const { openDefaultModal } = useModals();
      const { donateError } = useAeTippingBackend();

      try {
        await donateError({ ...this.entry, description: this.description });
        await openDefaultModal({
          title: this.$t('modals.donate-errors.title'),
          msg: this.$t('modals.donate-errors.msg'),
        });
      } catch (e) {
        await openDefaultModal({
          title: this.$t('modals.donate-errors-error.title'),
          msg: this.$t('modals.donate-errors-error.msg'),
        });
      } finally {
        this.$router.push('/account');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.donate-error {
  h1 {
    text-align: left;
    font-weight: normal;
    font-size: 16px;
    margin: 23px 0;
  }

  .error-info-title {
    text-transform: uppercase;
    color: variables.$color-grey-dark;
    text-align: left;
    font-size: 14px;
    margin: 0 0 15px;
  }

  .error-info-content {
    color: variables.$color-white;
    font-size: 15px;
    margin: 0;
    text-align: left;
    font-weight: normal;
    margin-bottom: 25px;
  }
}
</style>
