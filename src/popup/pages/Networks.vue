<template>
  <div
    data-cy="networks"
    class="networks"
  >
    <p class="text-description">
      {{ $t('pages.network.listLabel') }}
    </p>

    <div class="networks-list">
      <NetworkRow
        v-for="network in networks"
        :key="network.name"
        :network="network"
        @selectNetwork="selectNetwork"
      />
    </div>

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
  padding: var(--screen-padding-x);

  .networks-list {
    margin-top: 20px;
  }

  .add-custom-network {
    margin-top: 20px;
  }
}
</style>
