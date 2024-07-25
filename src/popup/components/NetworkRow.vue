<template>
  <RadioButton
    v-slot="{ checked }"
    :value="isActive"
    class="network-row"
    type="radio"
    name="activeNetwork"
    @input="$emit('selectNetwork', network.name)"
  >
    <div class="name-and-actions">
      <p
        class="name"
        :class="{ 'label-part-unchecked': !checked }"
        data-cy="network-name"
        v-text="network.name"
      />
      <div
        v-if="network.type === NETWORK_TYPE_CUSTOM"
        class="actions"
      >
        <BtnIcon
          size="sm"
          data-cy="network-edit"
          dimmed
          :to="{ name: ROUTE_NETWORK_EDIT, params: { name: network.name } }"
          :icon="PencilIcon"
        />
        <BtnIcon
          size="sm"
          data-cy="network-delete"
          dimmed
          :icon="TrashIcon"
          @click="$emit('deleteNetwork', network.name);"
        />
      </div>
    </div>

    <table
      class="network-details"
      :class="{ 'label-part-unchecked': !checked }"
    >
      <tbody>
        <tr
          v-for="(protocolSettings, protocol) in networkSettingsToDisplay"
          :key="protocol"
          class="url"
        >
          <td class="url-label" v-text="getProtocolName(protocol)" />
          <td class="url-address" v-text="protocolSettings.nodeUrl?.replace('https://', '')" />
        </tr>
      </tbody>
    </table>
  </RadioButton>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from 'vue';
import type { INetwork, NetworkProtocolsSettings, Protocol } from '@/types';
import { NETWORK_TYPE_CUSTOM } from '@/constants';
import { ROUTE_NETWORK_EDIT } from '@/popup/router/routeNames';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import RadioButton from './RadioButton.vue';
import BtnIcon from './buttons/BtnIcon.vue';
import PencilIcon from '../../icons/pencil.svg?vue-component';
import TrashIcon from '../../icons/trash.svg?vue-component';

export default defineComponent({
  components: {
    BtnIcon,
    RadioButton,
  },
  props: {
    network: { type: Object as PropType<INetwork>, required: true },
    isActive: Boolean,
  },
  emits: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectNetwork: (name: string) => true,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    deleteNetwork: (name: string) => true,
  },
  setup(props) {
    // Filter out the network protocol settings that has no `nodeUrl` default property
    const networkSettingsToDisplay = computed(
      (): NetworkProtocolsSettings => Object.fromEntries(
        (Object.keys(props.network.protocols) as (keyof typeof props.network.protocols)[])
          .map((protocol) => {
            const settings = props.network.protocols[protocol];
            return settings.nodeUrl ? [protocol, settings] : [];
          }),
      ),
    );

    function getProtocolName(protocol: Protocol) {
      return ProtocolAdapterFactory.getAdapter(protocol).protocolName;
    }

    return {
      NETWORK_TYPE_CUSTOM,
      ROUTE_NETWORK_EDIT,
      PencilIcon,
      TrashIcon,
      networkSettingsToDisplay,
      getProtocolName,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';
@use '@/styles/mixins';

.network-row {
  margin-bottom: 12px;

  .label-part-unchecked {
    opacity: 0.5;
  }

  .name-and-actions {
    display: flex;
    justify-content: space-between;

    .actions {
      @include mixins.flex(flex-end, center);

      gap: 4px;
      flex: 1;
    }
  }

  .network-details {
    @extend %face-sans-14-regular;

    width: 100%;
    border-spacing: 0;

    .url-label,
    .url-address {
      padding-block: 3px;
      line-height: 1.2em;
      vertical-align: top;
    }

    .url-label {
      width: 0;
      padding-right: 8px;
      opacity: 0.6;
      text-transform: capitalize;
      user-select: none;
      font-weight: 500;
    }
  }
}
</style>
