<template>
  <div
    data-cy="networks"
    class="networks"
  >
    <p class="screen-label">
      {{ $t('pages.network.listLabel') }}
    </p>
    <NetworkRow
      v-for="network in networks"
      :key="network.name"
      :network="network"
      @selectNetwork="selectNetwork"
    />
    <BtnMain
      extend
      variant="secondary"
      class="add-custom-network"
      data-cy="to-add"
      has-icon
      :to="{ name: 'network-add' }"
    >
      <PlusCircleIcon />
      {{ $t('pages.network.addCustomNetwork') }}
    </BtnMain>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import NetworkRow from '../components/NetworkRow.vue';
import PlusCircleIcon from '../../icons/plus-circle.svg?vue-component';
import BtnMain from '../components/buttons/BtnMain.vue';

export default {
  components: {
    BtnMain,
    NetworkRow,
    PlusCircleIcon,
  },
  computed: mapGetters(['networks']),
  methods: mapActions(['selectNetwork']),
};
</script>

<style lang="scss" scoped>
@use '../../styles/mixins';
@use '../../styles/variables';
@use '../../styles/typography';

.networks {
  margin: 16px var(--screen-padding-x);

  .screen-label {
    @extend %face-sans-14-regular;

    margin-bottom: 20px;
    color: rgba(variables.$color-white, 0.85);
  }

  .add-custom-network {
    margin-top: 16px;
  }
}
</style>
