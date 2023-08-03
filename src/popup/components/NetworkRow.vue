<template>
  <div class="network-row">
    <div
      class="network-row-inner"
      :class="{ 'inactive': !isActive }"
    >
      <RadioButton
        :value="isActive"
        type="radio"
        name="activeNetwork"
        @input="$emit('selectNetwork', network.name)"
      >
        <p
          class="name"
          data-cy="network-name"
        >
          {{ network.name }}
        </p>
        <div
          v-if="network.index !== undefined"
          class="action-wrapper"
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
            @click="deleteNetwork(network.index)"
          />
        </div>
      </RadioButton>
      <p
        class="url"
        data-cy="network-url"
      >
        <span class="url-label">
          {{ $t('pages.network.url') }}
        </span>
        {{ network.url }}
      </p>
      <p
        class="url"
        data-cy="network-middleware"
      >
        <span class="url-label">
          {{ $t('pages.network.middleware') }}
        </span>
        {{ network.middlewareUrl }}
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import { NETWORK_DEFAULT } from '@/constants';
import { ROUTE_NETWORK_EDIT } from '../router/routeNames';
import { useGetter } from '../../composables/vuex';

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
    network: {
      type: Object,
      required: true,
    },
  },
  setup(props, { emit }) {
    const store = useStore();
    const activeNetwork = useGetter('activeNetwork');

    const isActive = computed(() => props.network.name === activeNetwork.value.name);

    async function deleteNetwork(networkIndex: number) {
      if (networkIndex === activeNetwork.value.index) {
        emit('selectNetwork', NETWORK_DEFAULT.name);
      }
      store.commit('deleteUserNetwork', networkIndex);
    }

    return {
      PencilIcon,
      TrashIcon,
      isActive,
      deleteNetwork,
      ROUTE_NETWORK_EDIT,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/typography';
@use '../../styles/variables';
@use '../../styles/mixins';

.network-row {
  margin-bottom: 12px;

  .network-row-inner {
    &.inactive {
      opacity: 0.5;
    }

    .name {
      @extend %face-sans-15-medium;

      margin: 0;
    }

    .url {
      @extend %face-sans-14-regular;

      margin: 0 0 0 26px;
    }

    .url-label {
      @extend %face-sans-14-medium;

      margin-right: 4px;
      opacity: 0.6;
      user-select: none;
    }
  }

  .action-wrapper {
    @include mixins.flex(flex-end, center);

    gap: 4px;
    flex: 1;
  }
}
</style>
