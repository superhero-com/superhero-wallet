<template>
  <Form v-slot="{ errors }">
    <div
      class="network-form"
      data-cy="network-form"
    >
      <p class="text-description">
        {{ $t('pages.network.formLabel') }}
      </p>
      <Field
        v-for="input in formConfig"
        v-slot="{ field, errorMessage }"
        :key="input.key"
        :name="input.key"
        :rules="validatorRules(input.key)"
      >
        <InputField
          v-bind="field"
          v-model="newNetwork[input.key]"
          :name="input.key"
          :placeholder="input.placeholder"
          :label="input.label"
          :data-cy="input.dataCy"
          :message="errorMessage"
          :model-value="newNetwork[input.key]"
          :text-limit="input.textLimit"
        />
      </Field>

      <div class="button-wrapper">
        <BtnMain
          data-cy="cancel"
          variant="muted"
          class="cancel-button"
          extra-padded
          :text="$t('pages.network.cancel')"
          @click="goBack"
        />
        <BtnMain
          :disabled="buttonDisabled || (errors && Object.keys(errors).length > 0)"
          :icon="isEdit ? PlusCircleIcon : null"
          data-cy="connect"
          class="add-button"
          @click="addOrUpdateNetwork"
        >
          <template v-if="isEdit">
            {{ $t('pages.network.apply') }}
          </template>
          <template v-else>
            {{ $t('pages.network.addNetwork') }}
          </template>
        </BtnMain>
      </div>
    </div>
  </Form>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { Field, Form } from 'vee-validate';
import { ROUTE_NETWORK_SETTINGS } from '../router/routeNames';
import { defaultNetwork } from '../utils';
import BtnMain from '../components/buttons/BtnMain.vue';
import InputField from '../components/InputField.vue';
import PlusCircleIcon from '../../icons/plus-circle.svg?vue-component';

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
    Field,
    Form,
  },
  data() {
    return {
      PlusCircleIcon,
      newNetwork: {
        ...NETWORK_PROPS,
      },
      formConfig: [
        {
          key: 'name',
          placeholder: this.$t('pages.network.networkNamePlaceholder'),
          label: this.$t('pages.network.networkNameLabel'),
          dataCy: 'network',
          textLimit: 15,
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
    buttonDisabled() {
      return !Object.keys(NETWORK_PROPS).every((key) => !!this.newNetwork[key]);
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
      this.$router.push({ name: ROUTE_NETWORK_SETTINGS });
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
