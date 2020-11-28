<template>
  <div class="filters" data-cy="filters">
    <button @click="$emit('input', { ...value, latestFirst: !value.latestFirst })">
      <span>{{ $t('pages.transactionDetails.date') }}</span>
      <FilterArrow :class="{ rotate: !value.latestFirst }" />
    </button>
    <button
      v-for="filter in filters"
      :key="filter"
      :class="{ active: value.type === filter }"
      @click="$emit('input', { ...value, type: filter })"
    >
      {{ $t(`pages.transactionDetails.${filter}`) }}
    </button>
  </div>
</template>

<script>
import FilterArrow from '../../../icons/filter-arrow.svg?vue-component';

export default {
  components: { FilterArrow },
  props: {
    value: { type: Object, required: true },
  },
  data: () => ({
    filters: ['sent', 'claimed', 'withdrawals', 'topups', 'all'],
  }),
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.filters {
  position: sticky;
  top: 50px;
  top: calc(env(safe-area-inset-top) + 50px);
  background: $filters-bg;
  height: 40px;
  width: 100%;
  line-height: 40px;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  font-size: 13px;

  button {
    text-transform: capitalize;
    padding: 0;
    color: $accent-color;

    svg {
      height: 1em;

      &.rotate {
        transform: rotate(180deg);
      }
    }

    &:last-child {
      color: $secondary-color;
    }

    &.active {
      color: $white-color;
    }

    * {
      vertical-align: middle;
    }
  }
}
</style>
