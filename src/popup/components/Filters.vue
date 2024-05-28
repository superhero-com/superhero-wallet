<template>
  <div
    data-cy="filters"
    class="filters"
  >
    <BtnPlain
      v-for="(filterOptions, filterKey) in filters"
      :key="filterKey"
      class="filter"
      :class="{ active: modelValue.key === filterKey || modelValue.filter === filterKey }"
      @click="handleClick(filterKey)"
    >
      <span>{{ filterOptions.name }}</span>
      <SortIcon
        v-if="filterOptions.rotated !== undefined"
        :class="{ rotate: !filterOptions.rotated }"
      />
      <FilterArrowIcon v-else />
    </BtnPlain>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import { useViewport } from '../../composables/viewport';
import FilterArrowIcon from '../../icons/filter-arrow.svg?vue-component';
import SortIcon from '../../icons/sort.svg?vue-component';
import BtnPlain from './buttons/BtnPlain.vue';
import { IFilterInputPayload, IFilters } from '../../types';

export default defineComponent({
  components: {
    FilterArrowIcon,
    SortIcon,
    BtnPlain,
  },
  props: {
    modelValue: { type: Object as PropType<IFilterInputPayload>, required: true },
    filters: { type: Object as PropType<IFilters>, required: true },
    scrollTopThreshold: { type: Number, default: 140 },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { viewportElement } = useViewport();

    const rotatableFilters = ref(props.filters);

    function handleClick(filterKey: string) {
      const filterOptions = rotatableFilters.value[filterKey];

      if (viewportElement.value && viewportElement.value.scrollTop > props.scrollTopThreshold) {
        viewportElement.value.scrollTo({ top: props.scrollTopThreshold, behavior: 'smooth' });
      }

      if (filterOptions.rotated !== undefined && props.modelValue.key === filterKey) {
        filterOptions.rotated = !filterOptions.rotated;
      }

      const inputPayload: IFilterInputPayload = {
        ...rotatableFilters.value[filterKey],
        key: filterKey,
      };
      emit('update:modelValue', inputPayload);
    }

    return {
      rotatableFilters,
      handleClick,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

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
    max-height: 24px;
    gap: 2px;
    transition: all 0.08s ease-out;
    border-radius: 12px;
    color: rgba($color-white, 0.5);

    svg {
      width: 14px;
      height: 14px;
      color: rgba($color-white, 0.3);

      &.rotate {
        transform: rotate(180deg);
      }
    }

    &:hover,
    &.active {
      color: $color-white;
      background: rgba($color-white, 0.1);

      svg {
        color: rgba($color-white, 0.5);
      }
    }

    &:hover:not(.active) {
      opacity: 0.75;
    }
  }
}
</style>
