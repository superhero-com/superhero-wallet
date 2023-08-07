<template>
  <BtnBase
    v-bind="$attrs"
    class="browser-action-item"
    variant="dark"
  >
    <div class="browser-action-item-content">
      <IconWrapper
        v-if="icon"
        :icon="icon"
        class="card-icon"
        is-boxed
      />
      <div class="">
        <div class="browser-action-item-title">
          {{ title }}
        </div>
        <span class="browser-action-item-info">
          {{ info }}
        </span>
      </div>
    </div>
  </BtnBase>
</template>

<script>
import BtnBase from './buttons/BtnBase.vue';
import IconWrapper from './IconWrapper.vue';

export default {
  components: {
    BtnBase,
    IconWrapper,
  },
  props: {
    title: { type: String, required: true },
    info: { type: String, default: '' },
    icon: { type: Object, default: null },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';

.browser-action-item {
  @extend %face-sans-15-regular;

  align-items: center;
  width: 100%;
  min-height: 48px;
  margin-bottom: 8px;
  padding: 18px 2px 18px 12px;
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

  }

  &:active {
    transform: scale(0.99);
  }

  .card-icon{
    margin-right: 16px;
  }
  &-content {
    display: inline-flex;
    align-items: center;
  }

  &-info {
      opacity: 0.5;
      padding-right: 8px;
      margin: 0;
      color: $color-white;
      font-weight: 300;
      font-size: 14px;
    }
}
</style>
