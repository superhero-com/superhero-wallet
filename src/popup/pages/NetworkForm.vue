<template>
  <div
    class="network-form"
    data-cy="network-form"
  >
    <p class="text-description">
      {{ $t('pages.network.formLabel') }}
    </p>
    <InputField
      v-for="input in formConfig"
      :key="input.key"
      v-model="newNetwork[input.key]"
      v-validate="validatorRules(input.key)"
      :name="input.key"
      :placeholder="input.placeholder"
      :label="input.label"
      :data-cy="input.dataCy"
      :message="errors.first(input.key)"
      :value="newNetwork[input.key]"
      :text-limit="input.textLimit"
    />
    <div class="button-wrapper">
      <BtnMain
        data-cy="cancel"
        variant="secondary"
        class="cancel-button"
        @click="goBack"
      >
        {{ $t('pages.network.cancel') }}
      </BtnMain>
      <BtnMain
        :disabled="buttonDisabled"
        data-cy="connect"
        class="add-button"
        has-icon
        @click="addOrUpdateNetwork"
      >
        <template v-if="isEdit">
          {{ $t('pages.network.apply') }}
        </template>
        <template v-else>
          <PlusCircleIcon />
          {{ $t('pages.network.addNetwork') }}
        </template>
      </BtnMain>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import BtnMain from '../components/buttons/BtnMain.vue';
import InputField from '../components/InputField.vue';
import PlusCircleIcon from '../../icons/plus-circle.svg?vue-component';
import { defaultNetwork } from '../utils/constants';

export const NETWORK_PROPS = {
  url: null,
  name: null,
  middlewareUrl: defaultNetwork.middlewareUrl,
  compilerUrl: defaultNetwork.compilerUrl,
  backendUrl: defaultNetwork.backendUrl,
};

export default {
  components: {
    BtnMain,
    InputField,
    PlusCircleIcon,
  },
  data() {
    return {
      newNetwork: {
        ...NETWORK_PROPS,
      },
      formConfig: [
        {
          key: 'name',
          placeholder: this.$t('pages.network.networkNamePlaceholder'),
          label: this.$t('pages.network.networkNameLabel'),
          dateCy: 'network',
          textLimit: 17,
        },
        {
          key: 'url',
          placeholder: this.$t('pages.network.networkUrlPlaceholder'),
          label: this.$t('pages.network.networkUrlLabel'),
          dataCy: 'url',
        },
        {
          key: 'middlewareUrl',
          placeholder: this.$t('pages.network.networkMiddlewarePlaceholder'),
          label: this.$t('pages.network.networkMiddlewareLabel'),
          dataCy: 'middleware',
        },
        {
          key: 'compilerUrl',
          placeholder: this.$t('pages.network.networkCompilerPlaceholder'),
          label: this.$t('pages.network.networkCompilerLabel'),
          dataCy: 'compiler',
        },
        {
          key: 'backendUrl',
          placeholder: this.$t('pages.network.backendUrlPlaceholder'),
          label: this.$t('pages.network.backendUrlLabel'),
        },
      ],
      error: {},
    };
  },
  computed: {
    ...mapGetters(['networks']),
    hasErrors() {
      return this.errors.any();
    },
    buttonDisabled() {
      return !Object.keys(NETWORK_PROPS).every((key) => !!this.newNetwork[key]) || !!this.hasErrors;
    },
    isEdit() {
      return this.$route.name === 'network-edit';
    },
  },
  mounted() {
    const { name } = this.$route.params;
    if (name) {
      this.newNetwork = { ...this.networks[name] };
    }
  },
  methods: {
    ...mapActions(['selectNetwork']),
    goBack() {
      this.$router.push({ name: 'network-settings' });
    },
    validatorRules(key) {
      return key === 'name' ? {
        network_name: true,
        network_exists: [this.newNetwork?.index, this.networks],
      } : {
        required: true,
        invalid_hostname: true,
      };
    },
    async addOrUpdateNetwork() {
      if (this.hasErrors) return;

      this.$store.commit('setUserNetwork', {
        ...this.newNetwork,
        index: this.newNetwork.index,
      });
      await this.selectNetwork(this.newNetwork.name);
      this.goBack();
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/mixins';
@use '../../styles/typography';
@use '../../styles/variables';

.network-form {
  margin: 16px var(--screen-padding-x);

  .name-characters-left {
    @extend %face-sans-14-regular;

    opacity: 0.75;
  }

  .cancel-button {
    flex: 0;
    padding-inline: 32px;
  }

  .button-wrapper {
    @include mixins.flex(flex-start, center);

    margin-top: 35px;
    margin-bottom: 10px;
    gap: 8px;
  }
}
</style>
