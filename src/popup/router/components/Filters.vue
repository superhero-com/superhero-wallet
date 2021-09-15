<template>
  <div
    class="filters"
    data-cy="filters"
  >
    <ButtonPlain
      v-for="filter in Object.entries(filters)"
      :key="filter[0]"
      class="filter"
      :class="{ active: value.sort === filter[0] || value.filter === filter[0] }"
      @click="handleClick(filter)"
    >
      <span>{{ $t(`filters.${filter[0]}`) }}</span>
      <Sort
        v-if="filter[1].rotated !== undefined"
        :class="{ rotate: !rotatableFilters[filter[0]].rotated }"
      />
      <FilterArrow v-else />
    </ButtonPlain>
  </div>
</template>

<script>
import FilterArrow from '../../../icons/filter-arrow.svg?vue-component';
import Sort from '../../../icons/sort.svg?vue-component';
import ButtonPlain from './ButtonPlain';

export default {
  components: { FilterArrow, Sort, ButtonPlain },
  props: {
    value: { type: Object, required: true },
    filters: { type: Object, required: true },
  },
  data() {
    return {
      rotatableFilters: this.filters,
    };
  },
  methods: {
    handleClick([filter, { rotated = null }]) {
      if (rotated !== null) {
        if (this.value.sort === filter) {
          this.rotatableFilters[filter].rotated = !this.rotatableFilters[filter].rotated;
        }
        this.$emit('input',
          { ...this.value, sort: filter, rotated: this.rotatableFilters[filter].rotated });
        return;
      }
      this.$emit('input', { ...this.value, filter });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.filters {
  position: sticky;
  top: 48px;
  top: calc(env(safe-area-inset-top) + 48px);
  background: variables.$color-bg-3;
  height: 40px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;

  .filter {
    display: flex;
    align-items: center;

    @extend %face-sans-15-medium;

    color: variables.$color-dark-grey;

    &.active {
      color: variables.$color-green;
    }

    svg {
      margin-left: 4px;
      width: 16px;
      height: 16px;

      &.rotate {
        transform: rotate(180deg);
      }
    }
  }
}
</style>
