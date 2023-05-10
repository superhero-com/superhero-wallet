<template>
  <div
    class="network-form"
    data-cy="network-form"
  >
    <p
      v-if="isNetworkPrefilled"
      class="text-description color-warning"
    >
      {{ $t('pages.network.thirdPartyDetails') }}
    </p>
    <p
      v-else
      class="text-description"
    >
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
        :icon="isEdit ? null : PlusCircleIcon"
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
  computed,
  defineComponent,
  getCurrentScope,
  nextTick,
  onMounted,
  ref,
  set,
} from '@vue/composition-api';
import type { TranslateResult } from 'vue-i18n';
import { ROUTE_NETWORK_EDIT, ROUTE_NETWORK_SETTINGS } from '../router/routeNames';
import { NETWORK_DEFAULT } from '../utils';
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
  ...NETWORK_DEFAULT,
  url: '',
  name: '',
  networkId: 'custom', // TODO: In the future `networkId` will be removed from INetwork
};

const NETWORK_NAME_MAX_LENGTH = 15;

export default defineComponent({
  name: 'NetworkForm',
  components: {
    BtnMain,
    InputField,
  },
  setup(props, { root }) {
    const isEdit = root.$route.name === ROUTE_NETWORK_EDIT;

    const { $validator } = (getCurrentScope() as any).vm;
    const networks = useGetter('networks');
    const switchNetwork = useDispatch('switchNetwork');

    const newNetwork = ref<INetworkBase>({
      ...NETWORK_PROPS,
    });
    const isNetworkPrefilled = ref(false);

    const formConfig: IFormConfig[] = [
      {
        key: 'name',
        placeholder: root.$t('pages.network.networkNamePlaceholder'),
        label: root.$t('pages.network.networkNameLabel'),
        dataCy: 'network',
        textLimit: NETWORK_NAME_MAX_LENGTH,
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

    function goBack() {
      root.$router.push({ name: ROUTE_NETWORK_SETTINGS });
    }

    function validatorRules(key: keyof INetworkBase) {
      return key === 'name' ? {
        network_name: true,
        network_exists: [newNetwork.value?.index, networks.value],
        max: NETWORK_NAME_MAX_LENGTH,
      } : {
        required: true,
        invalid_hostname: true,
      };
    }

    async function addOrUpdateNetwork() {
      if (await $validator.validateAll()) {
        root.$store.commit('setUserNetwork', {
          ...newNetwork.value,
          index: newNetwork.value.index,
        });
        await switchNetwork(newNetwork.value.name);
        goBack();
      }
    }

    onMounted(async () => {
      const { params, query } = root.$route;

      if (isEdit) {
        newNetwork.value = { ...networks.value[params.name] };
      } else if (Object.keys(query).length) {
        // Fields that values are allowed to be passed from the URL query to the form model
        const keys: (keyof INetworkBase)[] = ['name', 'url', 'middlewareUrl', 'compilerUrl'];
        keys.forEach((key) => {
          const val = query[key];

          if (val && typeof val === 'string') {
            set(newNetwork.value, key, val);
            isNetworkPrefilled.value = true;
          }
        });

        await nextTick();
        $validator.validateAll();
      }
    });

    return {
      newNetwork,
      isNetworkPrefilled,
      error,
      hasErrors,
      networks,
      buttonDisabled,
      isEdit,
      formConfig,
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
