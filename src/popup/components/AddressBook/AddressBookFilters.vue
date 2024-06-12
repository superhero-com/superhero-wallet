<template>
  <!-- ! This should be the new look for all tabs/filters -->
  <div class="address-book-filters">
    <!-- All/Bookmarked Filters -->
    <BtnPill
      v-for="filter in filtersList"
      :key="filter"
      class="filter-btn"
      :class="{ active: filter === activeFilter }"
      :text="filter === 'all' ? $t('common.all') : ''"
      @click="setFilter(filter)"
    >
      <IconWrapper
        v-if="filter === ADDRESS_BOOK_FILTERS.bookmarked"
        :icon="FavoritesIcon"
        icon-size="rg"
      />
    </BtnPill>

    <div class="divider" />

    <!-- Protocol Filters -->
    <!-- TODO add horizontal scroll -->
    <BtnPill
      v-for="protocol in PROTOCOL_LIST"
      :key="protocol"
      class="filter-btn"
      :class="{ active: protocol === activeFilter }"
      @click="setFilter(protocol)"
    >
      <IconWrapper
        :protocol-icon="protocol"
        icon-size="rg"
      />
    </BtnPill>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { ADDRESS_BOOK_FILTERS, PROTOCOL_LIST } from '@/constants';

import BtnPill from '@/popup/components/buttons/BtnPill.vue';
import IconWrapper from '@/popup/components/IconWrapper.vue';

import FavoritesIcon from '@/icons/star-full.svg?vue-component';
import { useAddressBook } from '@/composables';

export default defineComponent({
  components: {
    BtnPill,
    IconWrapper,
  },
  setup() {
    const { activeFilter, setFilter } = useAddressBook();
    const filtersList = Object.values(ADDRESS_BOOK_FILTERS);

    return {
      activeFilter,
      filtersList,

      setFilter,

      FavoritesIcon,
      PROTOCOL_LIST,
      ADDRESS_BOOK_FILTERS,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.address-book-filters {
  display: flex;
  width: 100%;
  gap: 8px;

  .divider {
    border-left: 1px solid rgba($color-white, 0.15);
  }

  .filter-btn {
    @extend %face-sans-14-bold;
    line-height: 20px;
    padding: 3.5px 11.5px;
    border: 1px solid transparent;
  }

  .active {
    border-color: rgba($color-white, 0.15);
    background-color: rgba($color-white, 0.15);
    color: $color-white;
  }
}

</style>
