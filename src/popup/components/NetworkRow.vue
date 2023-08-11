<template>
  <div
    class="network-row"
    :class="{ 'inactive': !isActive }"
  >
    <RadioButton
      :value="isActive"
      type="radio"
      name="activeNetwork"
      @input="$emit('selectNetwork', network.name)"
    >
      <div class="name-and-actions">
        <p
          class="name"
          data-cy="network-name"
        >
          {{ network.name }}
        </p>
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
            icon-variant="danger"
            dimmed
            :icon="TrashIcon"
            @click="$emit('deleteNetwork', network.name);"
          />
        </div>
      </div>
    </RadioButton>

    <table class="network-details">
      <tbody>
        <tr
          v-for="(protocolSettings, protocol) in networkSettingsToDisplay"
          :key="protocol"
          class="url"
        >
          <td
            class="url-label"
            v-text="getProtocolName(protocol)"
          />
          <td>
            {{ protocolSettings.nodeUrl?.replace('https://', '') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from 'vue';
import type { INetwork, INetworkProtocolSettings, Protocol } from '@/types';
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
    selectNetwork: (name: string) => undefined,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    deleteNetwork: (name: string) => undefined,
  },
  setup(props) {
    // Filter out the network protocol settings that has no `nodeUrl` default property
    const networkSettingsToDisplay = computed(
      () => (Object.keys(props.network.protocols) as Protocol[])
        .reduce((networks, protocol) => {
          const settings = props.network.protocols[protocol];
          if (settings.nodeUrl) {
            // eslint-disable-next-line no-param-reassign
            networks[protocol] = settings;
          }
          return networks;
        }, {} as Record<Protocol, INetworkProtocolSettings>),
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

  &.inactive {
    opacity: 0.5;
  }

  .name-and-actions {
    display: flex;
    justify-content: space-between;

    .name {
      @extend %face-sans-15-medium;

      margin: 0;
    }

    .actions {
      @include mixins.flex(flex-end, center);

      gap: 4px;
      flex: 1;
    }
  }

  .network-details {
    @extend %face-sans-14-regular;

    margin: 0 0 0 26px;
    border-spacing: 0;

    td {
      padding: 0;
    }

    .url-label {
      @extend %face-sans-14-medium;

      padding-right: 8px;
      opacity: 0.6;
      user-select: none;
    }
  }
}
</style>
