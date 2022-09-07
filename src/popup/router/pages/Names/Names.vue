<template>
  <div class="names">
    <Plate>
      <Tabs
        slot="bottom"
        three
      >
        <RouterLink
          :to="{ name: 'name-list' }"
          exact-path
        >
          <Names /> {{ $t('pages.names.tabs.my-names') }}
        </RouterLink>
        <RouterLink :to="{ name: 'auction-list' }">
          <Auction /> {{ $t('pages.names.tabs.auctions') }}
        </RouterLink>
        <RouterLink :to="{ name: 'name-claim' }">
          <PlusCircle /> {{ $t('pages.names.tabs.register') }}
        </RouterLink>
      </Tabs>
    </Plate>
    <RouterView />
  </div>
</template>

<script>
import Plate from '../../components/Plate.vue';
import Tabs from '../../components/Tabs.vue';
import Names from '../../../../icons/names.svg?vue-component';
import Auction from '../../../../icons/auction.svg?vue-component';
import PlusCircle from '../../../../icons/plus-circle.svg?vue-component';

export default {
  components: {
    Plate, Tabs, Names, Auction, PlusCircle,
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';

.names .plate .tabs {
  padding: 4px 8px 4px 8px;
  background-color: variables.$color-bg-3;
}
</style>
