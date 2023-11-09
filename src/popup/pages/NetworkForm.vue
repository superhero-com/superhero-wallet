<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
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
          v-slot="{ field, errorMessage }"
          key="name"
          name="name"
          :rules="{
            required: true,
            network_exists: [customNetworks, savedNetworkName],
            max_len: NETWORK_NAME_MAX_LENGTH,
          }"
        >
          <InputField
            v-bind="field"
            v-model="newNetworkName"
            data-cy="network-name"
            :placeholder="$t('pages.network.networkNamePlaceholder')"
            :label="$t('pages.network.networkNameLabel')"
            :message="errorMessage"
            :text-limit="NETWORK_NAME_MAX_LENGTH"
          />
        </Field>

        <div
          v-for="{ inputs, name, protocol } in formStructure"
          :key="protocol"
          :data-cy="`group-${protocol}`"
        >
          <hr>
          <h3
            class="text-heading-3"
            v-text="name"
          />
          <Field
            v-for="input in inputs"
            v-slot="{ field, errorMessage }"
            :key="protocol + input.key"
            :name="`${protocol}-${input.key}`"
            :rules="{
              required: input.required === true,
              url: true,
              ...input.validationRules
            }"
          >
            <InputField
              v-bind="field"
              v-model="newNetworkProtocols[protocol][input.key]"
              :placeholder="input.getPlaceholder()"
              :label="input.getLabel()"
              :data-cy="input.key"
              :message="errorMessage"
            />
          </Field>
        </div>

        <Transition name="fade-transition">
          <InfoBox
            v-if="Object.keys(errors).length"
            class="invalid-form-message"
            :type="INFO_BOX_TYPES.danger"
            :text="$t('validation.formInvalid')"
          />
        </Transition>

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
            :icon="isEdit ? null : PlusCircleIcon"
            :disabled="!!Object.keys(errors).length"
            data-cy="btn-add-network"
            class="add-button"
            @click="addOrUpdateNetwork()"
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
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Field, useForm } from 'vee-validate';
import { IonPage, IonContent } from '@ionic/vue';
import type {
  AdapterNetworkSettingList,
  INetwork,
  NetworkProtocolSettingsRequired,
  NetworkProtocolsSettings,
  Protocol,
} from '@/types';
import {
  NETWORK_NAME_MAX_LENGTH,
  NETWORK_TYPE_CUSTOM,
  PROTOCOLS,
  PROTOCOL_AETERNITY,
} from '@/constants';
import { ROUTE_NETWORK_EDIT, ROUTE_NETWORK_SETTINGS } from '@/popup/router/routeNames';
import { useNetworks } from '@/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import type { AeNetworkProtocolSettings } from '@/protocols/aeternity/types';

import BtnMain from '../components/buttons/BtnMain.vue';
import InputField from '../components/InputField.vue';
import InfoBox, { INFO_BOX_TYPES } from '../components/InfoBox.vue';
import PlusCircleIcon from '../../icons/plus-circle.svg?vue-component';

interface IFormBlock {
  protocol: Protocol;
  name: string;
  inputs: AdapterNetworkSettingList;
}

export default defineComponent({
  name: 'NetworkForm',
  components: {
    InfoBox,
    BtnMain,
    InputField,
    Field,
    IonPage,
    IonContent,
  },
  setup() {
    const { setValues, validate, errors } = useForm();

    /**
     * The form is divided to blocks, where each block has the settings for one protocol.
     */
    const formStructure: IFormBlock[] = PROTOCOLS.map((protocol) => {
      const adapter = ProtocolAdapterFactory.getAdapter(protocol);
      return {
        protocol,
        name: adapter.protocolName,
        inputs: adapter.getNetworkSettings(),
      };
    });

    const router = useRouter();
    const route = useRoute();

    const {
      networks,
      customNetworks,
      switchNetwork,
      addCustomNetwork,
      updateCustomNetwork,
    } = useNetworks();

    const isEdit = route.name === ROUTE_NETWORK_EDIT;
    const savedNetworkName = route.params.name?.toString();
    const networkToEditIndex = (isEdit)
      ? customNetworks.value.findIndex(({ name }) => name === savedNetworkName)
      : null;

    const emptyNetworkSettings = Object.fromEntries(PROTOCOLS.map((protocol) => [protocol, {}]));
    const newNetworkName = ref('');
    const newNetworkProtocols = ref<NetworkProtocolsSettings>(emptyNetworkSettings as any);
    const isNetworkPrefilled = ref(false);

    function goBack() {
      router.replace({ name: ROUTE_NETWORK_SETTINGS });
    }

    async function addOrUpdateNetwork() {
      if (!(await validate()).valid) {
        return;
      }
      const network: INetwork = {
        name: newNetworkName.value,
        type: NETWORK_TYPE_CUSTOM,
        protocols: newNetworkProtocols.value,
      };
      if (isEdit) {
        updateCustomNetwork(networkToEditIndex!, network);
      } else {
        addCustomNetwork(network);
      }
      switchNetwork(newNetworkName.value);
      goBack();
    }

    /**
     * Every protocol has it's own default values for each of the setting.
     */
    function fillInFieldsWithDefaultValues() {
      PROTOCOLS.forEach((protocol) => {
        const adapter = ProtocolAdapterFactory.getAdapter(protocol);
        const settings = adapter.getNetworkSettings();
        newNetworkProtocols.value[protocol] = Object.fromEntries(settings
          .map(({ key, defaultValue }) => defaultValue ? [key, defaultValue] : []));
      });
    }

    /**
     * Feature related to Aeternity Protocol that allows to create custom network
     * with form values passed in the query string. Useful with Hyperchains.
     */
    function fillInFieldsWithQueryStringValues() {
      if (Object.keys(route.query).length) {
        // Fields that values are allowed to be passed from the URL query to the form model
        const keys: (NetworkProtocolSettingsRequired | AeNetworkProtocolSettings)[] = [
          'nodeUrl',
          'middlewareUrl',
        ];
        keys.forEach((key) => {
          const val = route.query[key];

          if (val && typeof val === 'string') {
            newNetworkProtocols.value[PROTOCOL_AETERNITY][key] = val;
            isNetworkPrefilled.value = true;
          }
        });
      }
    }

    /**
     * After filling the form fields with data taken from existing network (when editing)
     * or from default values we need to inform the VeeValidate Form about the values.
     */
    function setVeeValidateInitialValues() {
      const veeValidateValues: Record<string, string> = {
        name: newNetworkName.value,
      };
      PROTOCOLS.forEach((protocol) => {
        const settings = newNetworkProtocols.value[protocol];
        Object.keys(settings).forEach((key) => {
          veeValidateValues[`${protocol}-${key}`] = settings[key];
        });
      });
      setValues(veeValidateValues);
    }

    onMounted(async () => {
      if (isEdit) {
        newNetworkName.value = savedNetworkName;
        newNetworkProtocols.value = networks.value[newNetworkName.value].protocols;
      } else {
        fillInFieldsWithDefaultValues();
        fillInFieldsWithQueryStringValues();
      }

      setVeeValidateInitialValues();
    });

    return {
      NETWORK_NAME_MAX_LENGTH,
      INFO_BOX_TYPES,
      PlusCircleIcon,
      savedNetworkName,
      newNetworkProtocols,
      newNetworkName,
      networks,
      customNetworks,
      isNetworkPrefilled,
      isEdit,
      formStructure,
      errors,
      addOrUpdateNetwork,
      goBack,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/mixins';
@use '@/styles/typography';
@use '@/styles/variables';

.network-form {
  margin: 16px var(--screen-padding-x);

  .name-characters-left {
    @extend %face-sans-14-regular;

    opacity: 0.75;
  }

  .invalid-form-message {
    margin-top: 30px;
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
