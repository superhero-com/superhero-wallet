<template>
  <BtnBase
    v-bind="$attrs"
    class="panel-item"
    variant="dark"
    :to="to"
  >
    <div class="panel-item-left">
      <slot name="icon" />
      <div class="panel-item-title">
        {{ title }}
      </div>
    </div>
    <div class="panel-item-right">
      <div class="panel-item-info">
        {{ info }}
      </div>
      <slot
        v-if="$slots['content']"
        name="content"
      />
      <slot
        v-else
        name="right-icon"
        class="panel-item-arrow-right"
      >
        <ArrowRight
          v-if="to"
          class="icon-indicator"
        />
        <ExternalLink
          v-else
          class="icon-indicator"
        />
      </slot>
    </div>
  </BtnBase>
</template>

<script>
import ArrowRight from '../../icons/arrow-right.svg?vue-component';
import ExternalLink from '../../icons/external-link.svg?vue-component';
import BtnBase from './buttons/BtnBase.vue';

export default {
  components: {
    ArrowRight,
    ExternalLink,
    BtnBase,
  },
  props: {
    title: { type: String, required: true },
    info: { type: String, default: '' },
    to: { type: Object, default: null },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';

.panel-item {
  @extend %face-sans-15-regular;

  display: flex;
  align-items: center;
  width: 100%;
  min-height: 48px;
  margin-bottom: 8px;
  padding: 8px 2px 8px 12px;
  border-radius: $border-radius-interactive;
  justify-content: space-between;
  text-decoration: none;
  text-align: left;
  color: rgba($color-white, 0.75);
  transition: $transition-interactive;
  letter-spacing: 0.5px;
  will-change: transform;

  &:hover,
  &:active {
    color: $color-white;

    .panel-item-right {
      .icon-indicator {
        opacity: 0.75;
      }
    }
  }

  &:active {
    transform: scale(0.99);
  }

  .panel-item-left,
  .panel-item-right {
    display: inline-flex;
    align-items: center;
  }

  .panel-item-left {
    overflow-x: hidden;

    :deep(.icon) {
      width: 24px;
      height: 24px;
      margin-right: 8px;
    }
  }

  .panel-item-right {
    display: inline-flex;
    align-items: center;

    .panel-item-info {
      opacity: 0.5;
      padding-right: 8px;
      margin: 0;
      color: $color-white;
      font-weight: 300;
    }

    .icon-indicator {
      margin-right: 4px;
      width: 26px;
      height: 26px;
      opacity: 0.5;
      transition: $transition-interactive;
    }
  }
}
</style>
