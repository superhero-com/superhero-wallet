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
      </RadioButton>
      <p
        class="url"
        data-cy="network-url"
      >
        <span class="url-label">{{ $t('pages.network.url') }}</span>
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
    <NodeConnectionStatus
      v-if="isActive"
      is-settings
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import NodeConnectionStatus from './NodeConnectionStatus.vue';
import RadioButton from './RadioButton.vue';

export default {
  components: {
    RadioButton,
    NodeConnectionStatus,
  },
  props: {
    network: {
      type: Object,
      required: true,
    },
  },
  computed: {
    ...mapGetters(['activeNetwork']),
    isActive() {
      return this.network.name === this.activeNetwork.name;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/typography';

.network-row {
  margin-bottom: 12px;

  .network-row-inner {
    &.inactive {
      opacity: 0.5;
    }

    .name {
      @extend %face-sans-15-medium;
    }

    .url {
      @extend %face-sans-14-regular;

      margin: 0 0 0 26px;
    }

    .url-label {
      @extend %face-sans-14-medium;

      margin-right: 4px;
      opacity: 0.6;
    }
  }
}
</style>
