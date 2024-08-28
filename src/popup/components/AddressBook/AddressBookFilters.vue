<template>
  <div class="address-book-filters">
    <!-- All/Bookmarked Filters -->
    <BtnFilter
      :is-active="!showBookmarked && (!protocolFilter || isSelector)"
      :text="$t('common.all')"
      data-cy="all-filter"
      @click="clearFilters(!isSelector)"
    />

    <BtnFilter
      :is-active="showBookmarked"
      data-cy="bookmarked-filter"
      @click="() => setShowBookmarked(true, !isSelector)"
    >
      <IconWrapper
        :icon="FavoritesIcon"
        icon-size="rg"
      />
    </BtnFilter>

    <template v-if="!isSelector">
      <div class="divider" />

      <!-- Protocol Filters -->
      <HorizontalScroll class="protocol-filters">
        <BtnFilter
          v-for="protocol in PROTOCOL_LIST"
          :key="protocol"
          :data-cy="`${protocol}-filter`"
          class="filter-btn"
          :class="{ active: protocol === protocolFilter }"
          @click="setProtocolFilter(protocol)"
        >
          <IconWrapper
            :protocol-icon="protocol"
            icon-size="rg"
          />
        </BtnFilter>
      </HorizontalScroll>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import { PROTOCOL_LIST } from '@/constants';
import { useAddressBook } from '@/composables';

import BtnFilter from '@/popup/components/buttons/BtnFilter.vue';
import IconWrapper from '@/popup/components/IconWrapper.vue';

import FavoritesIcon from '@/icons/star-full.svg?vue-component';
import HorizontalScroll from '../HorizontalScroll.vue';

export default defineComponent({
  components: {
    BtnFilter,
    IconWrapper,
    HorizontalScroll,
  },
  props: {
    isSelector: Boolean,
  },
  setup() {
    const {
      protocolFilter,
      showBookmarked,
      setProtocolFilter,
      setShowBookmarked,
      clearFilters,
    } = useAddressBook();

    return {
      protocolFilter,
      showBookmarked,

      setProtocolFilter,
      setShowBookmarked,
      clearFilters,

      FavoritesIcon,
      PROTOCOL_LIST,
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

  .protocol-filters {
    display: flex;
    gap: 8px;
    overflow-y: scroll;
  }
}
</style>
