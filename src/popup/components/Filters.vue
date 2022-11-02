<template>
  <div
    data-cy="filters"
    class="filters"
  >
    <BtnPlain
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
    </BtnPlain>
  </div>
</template>

<script>
import FilterArrow from '../../icons/filter-arrow.svg?vue-component';
import Sort from '../../icons/sort.svg?vue-component';
import BtnPlain from './buttons/BtnPlain.vue';

export default {
  components: {
    FilterArrow,
    Sort,
    BtnPlain,
  },
  props: {
    value: { type: Object, required: true },
    filters: { type: Object, required: true },
    scrollTopThreshold: { type: Number, default: 140 },
  },
  data() {
    return {
      rotatableFilters: this.filters,
    };
  },
  methods: {
    handleClick([filter, { rotated = null }]) {
      const appContainer = document.querySelector('.app-inner');
      if (appContainer.scrollTop > this.scrollTopThreshold) {
        appContainer.scrollTo({ top: this.scrollTopThreshold, behavior: 'smooth' });
      }
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
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.filters {
  height: 36px;
  display: flex;
  gap: 8px;
  padding-bottom: 12px;
  background: var(--screen-bg-color);
  padding-inline: var(--screen-padding-x);
  margin-left: calc(-1 * var(--screen-padding-x));
  margin-right: calc(-1 * var(--screen-padding-x));
  z-index: 2;

  .filter {
    @extend %face-sans-14-regular;

    display: flex;
    align-items: center;
    padding: 2px 8px;
    gap: 2px;
    transition: all 0.08s ease-out;
    border-radius: 12px;
    color: rgba(variables.$color-white, 0.5);

    svg {
      width: 14px;
      height: 14px;
      color: rgba(variables.$color-white, 0.3);

      &.rotate {
        transform: rotate(180deg);
      }
    }

    &:hover,
    &.active {
      color: variables.$color-white;
      background: rgba(variables.$color-white, 0.1);

      svg {
        color: rgba(variables.$color-white, 0.5);
      }
    }

    &:hover:not(.active) {
      opacity: 0.75;
    }
  }
}
</style>
