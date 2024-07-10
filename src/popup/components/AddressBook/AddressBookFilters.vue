<template>
  <div class="address-book-filters">
    <!-- All/Bookmarked Filters -->
    <BtnFilter
      :is-active="!showBookmarked && (!protocolFilter || isSelector)"
      :text="$t('common.all')"
      @click="clearFilters(!isSelector)"
    />

    <BtnFilter
      :is-active="showBookmarked"
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
      <!-- TODO add horizontal scroll -->
      <BtnFilter
        v-for="protocol in PROTOCOL_LIST"
        :key="protocol"
        class="filter-btn"
        :class="{ active: protocol === protocolFilter }"
        @click="setProtocolFilter(protocol)"
      >
        <IconWrapper
          :protocol-icon="protocol"
          icon-size="rg"
        />
      </BtnFilter>
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

export default defineComponent({
  components: {
    BtnFilter,
    IconWrapper,
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
}
</style>
