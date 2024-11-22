<template>
  <div class="address-book-filters">
    <!-- All/Bookmarked Filters -->
    <BtnFilter
      v-if="!isSelector"
      :is-active="(
        accountSelectType === ACCOUNT_SELECT_TYPE_FILTER.addressBook
        && (!protocolFilter || isSelector)
      )"
      :text="$t('common.all')"
      data-cy="all-filter"
      @click="clearFilters(!isSelector)"
    />

    <BtnFilter
      v-if="hasBookmarkedEntries || !isSelector"
      :is-active="accountSelectType === ACCOUNT_SELECT_TYPE_FILTER.bookmarked"
      data-cy="bookmarked-filter"
      @click="() => setAccountSelectType(ACCOUNT_SELECT_TYPE_FILTER.bookmarked, !isSelector)"
    >
      <IconWrapper
        :icon="FavoritesIcon"
        icon-size="rg"
      />
    </BtnFilter>

    <template v-if="isSelector">
      <BtnFilter
        :is-active="(
          accountSelectType === ACCOUNT_SELECT_TYPE_FILTER.owned
          && (!protocolFilter || isSelector)
        )"
        :text="$t('pages.addressBook.filters.own')"
        data-cy="own-filter"
        @click="setAccountSelectType(ACCOUNT_SELECT_TYPE_FILTER.owned, !isSelector)"
      />

      <BtnFilter
        :is-active="(
          accountSelectType === ACCOUNT_SELECT_TYPE_FILTER.addressBook
          && (!protocolFilter || isSelector)
        )"
        :text="$t('pages.addressBook.filters.addressBook')"
        data-cy="address-book-filter"
        @click="setAccountSelectType(ACCOUNT_SELECT_TYPE_FILTER.addressBook, !isSelector)"
      />

      <BtnFilter
        :is-active="(
          accountSelectType === ACCOUNT_SELECT_TYPE_FILTER.recent
          && (!protocolFilter || isSelector)
        )"
        :text="$t('pages.addressBook.filters.recent')"
        data-cy="recent-filter"
        @click="setAccountSelectType(ACCOUNT_SELECT_TYPE_FILTER.recent, !isSelector)"
      >
        <IconWrapper
          :icon="HistoryIcon"
          icon-size="rg"
        />
        {{ $t('pages.addressBook.filters.recent') }}
      </BtnFilter>
    </template>

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

import { ACCOUNT_SELECT_TYPE_FILTER, PROTOCOL_LIST } from '@/constants';
import { useAccountSelector } from '@/composables';

import BtnFilter from '@/popup/components/buttons/BtnFilter.vue';
import IconWrapper from '@/popup/components/IconWrapper.vue';

import FavoritesIcon from '@/icons/star-full.svg?vue-component';
import HistoryIcon from '@/icons/history.svg?vue-component';
import HorizontalScroll from '../HorizontalScroll.vue';

export default defineComponent({
  components: {
    BtnFilter,
    IconWrapper,
    HorizontalScroll,
  },
  props: {
    isSelector: Boolean,
    hasBookmarkedEntries: Boolean,
  },
  setup() {
    const {
      accountSelectType,
      protocolFilter,
      setAccountSelectType,
      setProtocolFilter,
      clearFilters,
    } = useAccountSelector();

    return {
      accountSelectType,
      protocolFilter,

      setAccountSelectType,
      setProtocolFilter,
      clearFilters,

      FavoritesIcon,
      HistoryIcon,
      PROTOCOL_LIST,
      ACCOUNT_SELECT_TYPE_FILTER,
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
