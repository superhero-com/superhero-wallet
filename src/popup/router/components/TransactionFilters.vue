<template>
  <div id="filters" class="filters" data-cy="filters">
    <span
      class="date d-flex"
      :class="type === 'date' ? 'active' : ''"
      @click="filtrateTx('date', date_type)"
    >
      <span>{{ $t('pages.transactionDetails.date') }}</span>
      <FilterArrow :class="direction" />
    </span>
    <span
      v-for="filter in filters"
      v-bind:key="filter.id"
      :class="type === filter ? 'active' : filter"
      @click="filtrateTx(filter)"
      >{{ $t(`pages.transactionDetails.${filter}`) }}</span
    >
  </div>
</template>

<script>
import FilterArrow from '../../../icons/filter-arrow.svg?vue-component';

export default {
  components: {
    FilterArrow,
  },
  data() {
    return {
      filters: ['sent', 'received', 'withdrawals', 'topups', 'all'],
      direction: '',
      type: 'date',
      date_type: 'recent',
    };
  },
  methods: {
    filtrateTx(type, dateType) {
      this.date_type = '';
      if (type === 'date')
        if (dateType === 'recent') {
          this.date_type = 'oldest';
          this.direction = 'rotate';
        } else {
          this.date_type = 'recent';
          this.direction = '';
        }
      this.type = type;
      this.$emit('filtrate', this.type, this.date_type);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

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

  span {
    text-transform: capitalize;
    cursor: pointer;
    color: $accent-color !important;
  }

  span.all {
    color: $secondary-color !important;
  }

  span.active,
  span.active > * {
    color: $white-color !important;
  }

  .d-flex {
    display: flex;

    svg {
      padding-top: 13px;
      height: 100%;
    }
  }

  .rotate {
    transform: rotate(180deg);
  }
}
</style>
