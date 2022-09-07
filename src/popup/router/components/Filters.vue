<template>
  <div
    class="filters"
    data-cy="filters"
    :class="{ fixed }"
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
import ButtonPlain from './ButtonPlain.vue';

export default {
  components: { FilterArrow, Sort, ButtonPlain },
  props: {
    value: { type: Object, required: true },
    filters: { type: Object, required: true },
    fixed: Boolean,
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
  height: 50px;
  width: 100%;
  display: flex;
  gap: 8px;
  padding: 13px 0;
  background-color: var(--screen-bg-color);

  &.fixed {
    position: sticky;
    top: 48px;
    top: calc(env(safe-area-inset-top) + 48px);
  }

  .filter {
    display: flex;
    align-items: center;
    padding: 2px 8px;
    gap: 2px;

    @extend %face-sans-14-regular;

    color: rgba(variables.$color-white, 0.5);

    svg {
      width: 14px;
      height: 14px;
      color: rgba(variables.$color-white, 0.3);

      &.rotate {
        transform: rotate(180deg);
      }
    }

    &.active {
      color: variables.$color-white;
      background: rgba(variables.$color-white, 0.1);
      border-radius: 12px;

      svg {
        color: rgba(variables.$color-white, 0.5);
      }
    }
  }
}
</style>
