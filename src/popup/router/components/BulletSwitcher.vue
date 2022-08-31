<template>
  <div class="bullet-switcher">
    <div class="bullet-switcher-wrapper">
      <div
        class="bullet-switcher-container"
        :style="cssProps"
      >
        <div
          v-for="(_, idx) in optionsSize"
          :key="idx"
          class="bullet"
          :class="{
            medium: getMediumCondition(idx),
            big: getBigCondition(idx),
            active: idx === currentIdx,
          }"
          :style="getBulletTranslation(idx)"
          @click="$emit('change', idx)"
        />
      </div>
    </div>
    <PlusCircle
      :class="{ active: currentIdx === optionsSize }"
      @click="$emit('change', optionsSize)"
    />
  </div>
</template>

<script>
import PlusCircle from '../../../icons/plus-circle-fill.svg?vue-component';

export default {
  components: {
    PlusCircle,
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
  computed: {
    cssProps() {
      return {
        '--active-color': this.activeColor,
      };
    },
  },
  methods: {
    getBulletTranslation(idx) {
      if (idx !== 0) return {};
      const scrollingTreshold = 3;
      if (this.currentIdx < scrollingTreshold) return {};
      const bulletSize = 16;
      if (this.currentIdx >= this.optionsSize - 1) return { marginLeft: `-${(this.optionsSize - 4) * bulletSize - bulletSize}px` };
      return { marginLeft: `-${(this.currentIdx - scrollingTreshold) * bulletSize}px` };
    },
    getBigCondition(idx) {
      const firstCondition = this.currentIdx === 0 ? this.currentIdx === (idx - 2) : false;
      const lastCondition = this.currentIdx === this.optionsSize
        ? [(idx + 2), (idx + 3)].includes(this.currentIdx)
        : false;
      return this.currentIdx === idx
       || this.currentIdx === idx + 1
       || this.currentIdx === idx - 1
        || firstCondition
        || lastCondition;
    },
    getMediumCondition(idx) {
      // eslint-disable-next-line no-nested-ternary
      const offset = this.currentIdx === 0 ? 3 : this.currentIdx === this.optionsSize ? 4 : 2;
      return this.currentIdx === (idx - offset) || this.currentIdx === (idx + offset);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/mixins';
@use '../../../styles/variables';

.bullet-switcher {
  @include mixins.flex(flex-start, center);

  .plus-circle-fill {
    width: 19px;
    height: 19px;
    margin-left: 12px;
    cursor: pointer;
    color: rgba(variables.$color-white, 0.5);
    transition: all 0.25s ease-out;

    &.active {
      color: variables.$color-green-dark;
    }
  }
}

.bullet-switcher-wrapper {
  padding-left: 24px;
}

.bullet-switcher-wrapper,
.bullet-switcher-container {
  max-width: 96px;
  overflow: hidden;
}

.bullet-switcher-container {
  @include mixins.flex(flex-start, center);

  height: 40px;
  gap: 8px;

  .bullet {
    background-color: rgba(variables.$color-white, 0.2);
    min-width: 8px;
    min-height: 8px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.25s ease-out;
    transform: scale(0.5);

    &.big {
      transform: scale(1);
    }

    &.medium {
      transform: scale(0.75);
    }

    &.active {
      background-color: var(--active-color);
    }
  }
}
</style>
