<template>
  <Form v-slot="{ errors }">
    <div
      class="network-form"
      data-cy="network-form"
    >
      <InfoBox
        v-if="isNetworkPrefilled"
        :type="INFO_BOX_TYPES.warning"
        :text="$t('pages.network.thirdPartyDetails')"
      />
      <p
        v-else
        class="text-description"
      >
        {{ $t('pages.network.formLabel') }}
      </p>
      <Field
        v-for="input in formConfig"
        v-slot="{ field, errorMessage }"
        :key="input.key"
        :name="input.key"
        :rules="validatorRules(input.key)"
        :validate-on-mount="fieldsToCheckOnMount!.includes(input.key)"
      >
        <InputField
          v-bind="field"
          v-model="newNetwork[input.key]"
          :name="input.key"
          :placeholder="input.placeholder"
          :label="input.label"
          :data-cy="input.dataCy"
          :message="errorMessage"
          :text-limit="input.textLimit"
        />
      </Field>
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

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  ref,
} from 'vue';
import { TranslateResult, useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { Field, Form } from 'vee-validate';
import { ROUTE_NETWORK_EDIT, ROUTE_NETWORK_SETTINGS } from '../router/routeNames';
import { NETWORK_DEFAULT } from '../utils';
import { useDispatch, useGetter } from '../../composables/vuex';
import type { INetworkBase } from '../../types';

import BtnMain from '../components/buttons/BtnMain.vue';
import InputField from '../components/InputField.vue';
import InfoBox, { INFO_BOX_TYPES } from '../components/InfoBox.vue';
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
    InfoBox,
    BtnMain,
    InputField,
    Field,
    Form,
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const { t } = useI18n();

    const isEdit = route.name === ROUTE_NETWORK_EDIT;

    const networks = useGetter('networks');
    const switchNetwork = useDispatch('switchNetwork');

    const newNetwork = ref<INetworkBase>({
      ...NETWORK_PROPS,
    });
    const isNetworkPrefilled = ref(false);
    const fieldsToCheckOnMount = ref<string[] | null>(null);

    const formConfig: IFormConfig[] = [
      {
        key: 'name',
        placeholder: t('pages.network.networkNamePlaceholder'),
        label: t('pages.network.networkNameLabel'),
        dataCy: 'network',
        textLimit: NETWORK_NAME_MAX_LENGTH,
      },
      {
        key: 'url',
        placeholder: t('pages.network.networkUrlPlaceholder'),
        label: t('pages.network.networkUrlLabel'),
        dataCy: 'url',
      },
      {
        key: 'middlewareUrl',
        placeholder: t('pages.network.networkMiddlewarePlaceholder'),
        label: t('pages.network.networkMiddlewareLabel'),
        dataCy: 'middleware',
      },
      {
        key: 'compilerUrl',
        placeholder: t('pages.network.networkCompilerPlaceholder'),
        label: t('pages.network.networkCompilerLabel'),
        dataCy: 'compiler',
      },
      {
        key: 'backendUrl',
        placeholder: t('pages.network.backendUrlPlaceholder'),
        label: t('pages.network.backendUrlLabel'),
      },
    ];

    const error = ref({});

    const buttonDisabled = computed(
      () => !Object.keys(NETWORK_PROPS).every(
        (key) => !!newNetwork.value[key as keyof INetworkBase],
      ),
    );

    function goBack() {
      router.push({ name: ROUTE_NETWORK_SETTINGS });
    }

    function validatorRules(key: keyof INetworkBase) {
      return key === 'name' ? {
        required: true,
        network_name: true,
        network_exists: [newNetwork.value?.index, networks.value],
        max_len: NETWORK_NAME_MAX_LENGTH,
      } : {
        required: true,
        invalid_hostname: true,
      };
    }

    async function addOrUpdateNetwork() {
      store.commit('setUserNetwork', {
        ...newNetwork.value,
        index: newNetwork.value.index,
      });
      await switchNetwork(newNetwork.value.name);
      goBack();
    }

    onMounted(async () => {
      const { params, query } = route;
      fieldsToCheckOnMount.value = Object.keys(query);

      if (isEdit) {
        newNetwork.value = { ...networks.value[params.name.toString()] };
      } else if (Object.keys(query).length) {
        // Fields that values are allowed to be passed from the URL query to the form model
        const keys: (keyof INetworkBase)[] = ['name', 'url', 'middlewareUrl', 'compilerUrl'];
        keys.forEach((key) => {
          const val = query[key];

          if (val && typeof val === 'string') {
            (newNetwork.value[key as keyof INetworkBase] as string) = val;
            isNetworkPrefilled.value = true;
          }
        });

        await nextTick();
      }
    });

    return {
      INFO_BOX_TYPES,
      newNetwork,
      isNetworkPrefilled,
      error,
      networks,
      buttonDisabled,
      isEdit,
      formConfig,
      addOrUpdateNetwork,
      fieldsToCheckOnMount,
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
