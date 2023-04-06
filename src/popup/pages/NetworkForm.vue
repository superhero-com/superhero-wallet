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
        variant="muted"
        class="cancel-button"
        extra-padded
        :text="$t('common.cancel')"
        @click="goBack"
      />
      <BtnMain
        :disabled="buttonDisabled"
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
</template>

<script lang="ts">
import {
  computed, defineComponent, onMounted, ref,
  getCurrentInstance,
} from 'vue';
import type { TranslateResult } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ROUTE_NETWORK_EDIT, ROUTE_NETWORK_SETTINGS } from '../router/routeNames';
import { defaultNetwork } from '../utils';
import { useDispatch, useGetter } from '../../composables/vuex';
import type { INetworkBase } from '../../types';

import BtnMain from '../components/buttons/BtnMain.vue';
import InputField from '../components/InputField.vue';
import PlusCircleIcon from '../../icons/plus-circle.svg?vue-component';

interface IFormConfig {
  key: keyof INetworkBase
  placeholder: TranslateResult
  label: TranslateResult
  dataCy?: string
  textLimit?: number
}

const NETWORK_PROPS: INetworkBase = {
  url: '',
  name: '',
  middlewareUrl: defaultNetwork.middlewareUrl,
  compilerUrl: defaultNetwork.compilerUrl,
  backendUrl: defaultNetwork.backendUrl,
};

export default defineComponent({
  components: {
    BtnMain,
    InputField,
  },
  setup(props) {
    const instance = getCurrentInstance();
    const root = instance?.root as any;
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const networks = useGetter('networks');
    const selectNetwork = useDispatch('selectNetwork');

    const newNetwork = ref<INetworkBase>({
      ...NETWORK_PROPS,
    });

    const formConfig: IFormConfig[] = [
      {
        key: 'name',
        placeholder: root.$t('pages.network.networkNamePlaceholder'),
        label: root.$t('pages.network.networkNameLabel'),
        dataCy: 'network',
        textLimit: 15,
      },
      {
        key: 'url',
        placeholder: root.$t('pages.network.networkUrlPlaceholder'),
        label: root.$t('pages.network.networkUrlLabel'),
        dataCy: 'url',
      },
      {
        key: 'middlewareUrl',
        placeholder: root.$t('pages.network.networkMiddlewarePlaceholder'),
        label: root.$t('pages.network.networkMiddlewareLabel'),
        dataCy: 'middleware',
      },
      {
        key: 'compilerUrl',
        placeholder: root.$t('pages.network.networkCompilerPlaceholder'),
        label: root.$t('pages.network.networkCompilerLabel'),
        dataCy: 'compiler',
      },
      {
        key: 'backendUrl',
        placeholder: root.$t('pages.network.backendUrlPlaceholder'),
        label: root.$t('pages.network.backendUrlLabel'),
      },
    ];

    const error = ref({});

    const hasErrors = computed(() => (root as any).$validator.errors.items?.length);

    const buttonDisabled = computed(
      () => !Object.keys(NETWORK_PROPS).every(
        (key) => !!newNetwork.value[key as keyof INetworkBase],
      )
      || !!hasErrors.value,
    );

    const isEdit = computed(() => route.name === ROUTE_NETWORK_EDIT);

    function goBack() {
      router.push({ name: ROUTE_NETWORK_SETTINGS });
    }

    function validatorRules(key: keyof INetworkBase) {
      return key === 'name' ? {
        network_name: true,
        network_exists: [newNetwork.value?.index, networks.value],
      } : {
        required: true,
        invalid_hostname: true,
      };
    }

    async function addOrUpdateNetwork() {
      if (hasErrors.value) {
        return;
      }

      store.commit('setUserNetwork', {
        ...newNetwork.value,
        index: newNetwork.value.index,
      });
      await selectNetwork(newNetwork.value.name);
      goBack();
    }

    onMounted(() => {
      const { name } = route.params;
      if (name) {
        newNetwork.value = { ...networks.value[name] };
      }
    });

    return {
      newNetwork,
      error,
      hasErrors,
      networks,
      buttonDisabled,
      isEdit,
      formConfig,
      selectNetwork,
      addOrUpdateNetwork,
      validatorRules,
      goBack,
      PlusCircleIcon,
    };
  },
});
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
