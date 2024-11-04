<template>
  <div
    class="bullet-switcher"
    :style="{
      '--active-color': activeColor,
      '--bullet-size': `${BULLET_SIZE}px`,
    }"
  >
    <div class="bullet-switcher-container">
      <div
        class="bullet-switcher-track"
        :style="{
          '--translate-x-value': `${translateXValue}px`,
        }"
      >
        <BtnPlain
          v-for="(_, idx) in optionsSize"
          :key="idx"
          :class="{
            medium: isMedium(idx),
            small: isSmall(idx),
            active: idx === currentIdx,
          }"
          class="bullet-link"
          @click="$emit('change', idx)"
        >
          <span class="bullet" />
        </BtnPlain>
      </div>
    </div>

    <PlusCircleIcon
      class="add-icon"
      :class="{ active: currentIdx === optionsSize }"
      data-cy="bullet-switcher-add"
      @click="$emit('change', optionsSize)"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';

import BtnPlain from './buttons/BtnPlain.vue';
import PlusCircleIcon from '../../icons/plus-circle.svg?vue-component';

// Physical size of the bullet area in pixels
const BULLET_SIZE = 16;

// Which bullet stays visible if user navigates right
const SCROLLING_THRESHOLD = 3;

const RESIZE_THRESHOLD = 5;

export default defineComponent({
  components: {
    BtnPlain,
    PlusCircleIcon,
  },
  props: {
    activeColor: {
      type: String,
      required: true,
    },
    currentIdx: {
      type: Number,
      required: true,
    },
    optionsSize: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const isResizing = computed(() => props.optionsSize > RESIZE_THRESHOLD);

    const translateXValue = computed(() => {
      let bulletsToMoveLeft: number;
      if (props.currentIdx < SCROLLING_THRESHOLD || !isResizing.value) {
        bulletsToMoveLeft = 0;
      } else if (props.currentIdx >= props.optionsSize - 1) {
        bulletsToMoveLeft = props.optionsSize - 5;
      } else {
        bulletsToMoveLeft = props.currentIdx - SCROLLING_THRESHOLD;
      }
      return -bulletsToMoveLeft * BULLET_SIZE;
    });

    function calculateIdxDistance(idx: number) {
      return Math.abs(props.currentIdx - idx) - ((props.currentIdx === 0) ? 1 : 0);
    }

    function isMedium(idx: number) {
      if (!isResizing.value) {
        return false;
      }
      return calculateIdxDistance(idx) === 2;
    }

    function isSmall(idx: number) {
      if (!isResizing.value) {
        return false;
      }
      return calculateIdxDistance(idx) > 2;
    }

    return {
      BULLET_SIZE,
      translateXValue,
      isMedium,
      isSmall,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/mixins';
@use '@/styles/variables' as *;

.bullet-switcher {
  @include mixins.flex(flex-start, center);

  height: 40px;
  padding-left: 4px;

  .add-icon {
    width: 19px;
    height: 19px;
    margin-left: 8px;
    cursor: pointer;
    color: rgba($color-white, 0.5);
    transition: all 0.25s ease-out;

    &.active,
    &:hover {
      color: $color-white;
    }
  }

  .bullet-switcher-container {
    max-width: calc(var(--bullet-size) * 5);
    overflow: hidden;

    .bullet-switcher-track {
      display: flex;
      margin-left: var(--translate-x-value);
      transition: margin-left 0.3s ease-out;
    }

    .bullet-link {
      --bullet-scale: 1;

      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: var(--bullet-size);
      height: var(--bullet-size);

      &:hover {
        .bullet {
          transform: scale(1.2) !important;
        }
      }

      &.small {
        --bullet-scale: 0.5;
      }

      &.medium {
        --bullet-scale: 0.75;
      }

      &.active {
        .bullet {
          background-color: var(--active-color);
        }
      }

      .bullet {
        background-color: rgba($color-white, 0.2);
        min-width: 8px;
        min-height: 8px;
        border-radius: 50%;
        transform: scale(var(--bullet-scale));
        transition: all 0.25s ease-out;
      }
    }
  }
}
</style>
