<template>
  <div class="filters-bar">
    <!-- Address Book layout: left: All + star; right: protocol selector -->
    <template v-if="!isSelector">
      <div class="left-stack">
        <BtnFilter
          :is-active="(
            accountSelectType === ACCOUNT_SELECT_TYPE_FILTER.addressBook
            && (!protocolFilter || isSelector)
          )"
          :text="$t('common.all')"
          data-cy="all-filter"
          @click="onClickAll"
        />

        <BtnFilter
          v-if="showBookmark && (hasBookmarkedEntries || !isSelector)"
          :is-active="accountSelectType === ACCOUNT_SELECT_TYPE_FILTER.bookmarked"
          data-cy="bookmarked-filter"
          @click="() => setAccountSelectType(ACCOUNT_SELECT_TYPE_FILTER.bookmarked, !isSelector)"
        >
          <IconWrapper
            :icon="FavoritesIcon"
            icon-size="rg"
          />
        </BtnFilter>
      </div>

      <!-- Single protocol filter opening modal -->
      <BtnFilter
        class="filter-btn protocol-filter-single"
        :class="{ active: !!protocolFilter }"
        data-cy="protocol-filter"
        @click="openProtocolSelector"
      >
        <template v-if="protocolFilter">
          <span class="left">
            <IconWrapper
              :protocol-icon="protocolFilter"
              icon-size="rg"
            />
            {{ getProtocolName(protocolFilter) }}
          </span>
          <ChevronDownIcon class="chevron" />
        </template>
        <template v-else>
          <span class="left">{{ protocolFilterDefaultText }}</span>
          <ChevronDownIcon class="chevron" />
        </template>
      </BtnFilter>
    </template>

    <!-- Selector layout: three horizontal filters -->
    <template v-else>
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useI18n } from 'vue-i18n';

import { ACCOUNT_SELECT_TYPE_FILTER, MODAL_PROTOCOL_SELECT } from '@/constants';
import { useAccountSelector, useModals } from '@/composables';
import type { Protocol } from '@/types';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import BtnFilter from '@/popup/components/buttons/BtnFilter.vue';
import IconWrapper from '@/popup/components/IconWrapper.vue';
import ChevronDownIcon from '@/icons/chevron-down.svg?vue-component';

import FavoritesIcon from '@/icons/star-full.svg?vue-component';
import HistoryIcon from '@/icons/history.svg?vue-component';

export default defineComponent({
  components: {
    BtnFilter,
    IconWrapper,
    ChevronDownIcon,
  },
  props: {
    isSelector: Boolean,
    hasBookmarkedEntries: Boolean,
    showBookmark: Boolean,
  },
  emits: ['filters-cleared'],
  setup(props, { emit }) {
    const { t } = useI18n();
    const { openModal } = useModals();
    const {
      accountSelectType,
      protocolFilter,
      setAccountSelectType,
      setProtocolFilter,
      clearFilters,
    } = useAccountSelector();

    async function openProtocolSelector() {
      const selected = await openModal<Protocol>(MODAL_PROTOCOL_SELECT, {
        title: t('pages.addressBook.filters.filterByBlockchain'),
        subtitle: t('pages.addressBook.filters.filterByBlockchainSubtitle'),
        resolve: (protocol: Protocol) => protocol,
      });
      if (selected) setProtocolFilter(selected);
    }

    function getProtocolName(protocol: Protocol) {
      return ProtocolAdapterFactory.getAdapter(protocol).protocolName;
    }

    const protocolFilterDefaultText = t('pages.addressBook.filterByBlockchain', 'Filter by blockchain');

    function onClickAll() {
      clearFilters(!props.isSelector);
      // eslint-disable-next-line vue/custom-event-name-casing
      (emit as any)('filters-cleared');
    }

    return {
      accountSelectType,
      protocolFilter,

      setAccountSelectType,
      setProtocolFilter,
      clearFilters,

      openProtocolSelector,
      getProtocolName,
      protocolFilterDefaultText,
      onClickAll,

      FavoritesIcon,
      HistoryIcon,
      ACCOUNT_SELECT_TYPE_FILTER,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.filters-bar {
  display: flex;
  width: 100%;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;

  .left-stack {
    display: flex;
    flex-direction: row;
    gap: 8px;
    flex-shrink: 0;
  }

  .protocol-filters {
    display: flex;
    gap: 8px;
    overflow-y: scroll;
  }

  .protocol-filter-single {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 auto;
    justify-content: space-between;
    max-width: none;

    .left {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chevron {
      flex-shrink: 0;
      width: 8px !important;
      height: 5px !important;
      opacity: 0.75;
    }
  }
}
</style>
