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
            size="rg"
            data-cy="edit"
            variant="dimmed"
            :to="{ name: 'network-edit', params: { name: network.name } }"
          >
            <PencilIcon />
          </BtnIcon>
          <BtnIcon
            size="rg"
            data-cy="delete"
            variant="danger"
            @click="deleteNetwork(network.index)"
          >
            <TrashIcon />
          </BtnIcon>
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

<script>
import { mapGetters } from 'vuex';
import { defaultNetwork } from '../utils/constants';
import RadioButton from './RadioButton.vue';
import BtnIcon from './buttons/BtnIcon.vue';
import PencilIcon from '../../icons/pencil.svg?vue-component';
import TrashIcon from '../../icons/trash.svg?vue-component';

export default {
  components: {
    BtnIcon,
    RadioButton,
    PencilIcon,
    TrashIcon,
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
  methods: {
    async deleteNetwork(networkIndex) {
      if (networkIndex === this.activeNetwork.index) {
        this.$emit('selectNetwork', defaultNetwork.name);
      }
      this.$store.commit('deleteUserNetwork', networkIndex);
    },
  },
};
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
    }
  }

  .action-wrapper {
    @include mixins.flex(flex-end, center);

    gap: 4px;
    flex: 1;
  }
}
</style>
