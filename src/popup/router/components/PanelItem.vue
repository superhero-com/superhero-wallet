<template>
  <Component
    :is="to ? 'RouterLink' : 'button'"
    :to="to"
    class="panel-item"
    @click="$emit('click')"
  >
    <span class="panel-item-title">{{ title }}</span>
    <div class="panel-item-right">
      <div class="panel-item-info">
        {{ info }}
      </div>
      <slot
        v-if="$slots['content']"
        name="content"
      />
      <ArrowRight
        v-else
        class="panel-item-arrow-right"
      />
    </div>
  </Component>
</template>

<script>
import ArrowRight from '../../../icons/arrow-right.svg?vue-component';

export default {
  components: {
    ArrowRight,
  },
  props: {
    title: { type: String, required: true },
    info: { type: String, default: '' },
    to: { type: [String, Object], default: null },
  },
};
</script>

<style lang="scss" scoped>
@use "../../../styles/variables";
@use "../../../styles/typography";

.panel-item {
  margin: 8px;
  padding: 8px 12px;
  width: auto;
  min-height: 48px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  text-decoration: none;
  text-align: left;
  background: rgba(variables.$color-white, 0.08);
  color: rgba(variables.$color-white, 0.85);
  -webkit-transition: 0.4s;
  transition: 0.4s;
  opacity: 0.75;

  @extend %face-sans-14-regular;

  &:hover {
    opacity: 1;
    background: rgba(variables.$color-white, 0.1);

    &,
    ::v-deep svg {
      color: variables.$color-white;
    }
  }

  .panel-item-right {
    display: inline-flex;
    align-items: center;
  }

  .panel-item-arrow-right {
    margin-right: 4px;
    width: 9.21px;
    height: 16px;
  }

  .panel-item-info {
    opacity: 0.5;
    padding-right: 16px;
    margin: 0;
    color: variables.$color-white;
  }
}
</style>
