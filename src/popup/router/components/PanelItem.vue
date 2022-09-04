<template>
  <Component
    :is="to ? 'RouterLink' : 'a'"
    :to="to"
    :href="href"
    class="panel-item"
    @click="$emit('click')"
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
        <ArrowRight v-if="to" />
        <ExternalLink v-else />
      </slot>
    </div>
  </Component>
</template>

<script>
import ArrowRight from '../../../icons/arrow-right.svg?vue-component';
import ExternalLink from '../../../icons/external-link.svg?vue-component';

export default {
  components: {
    ArrowRight,
    ExternalLink,
  },
  props: {
    title: { type: String, required: true },
    info: { type: String, default: '' },
    to: { type: [String, Object], default: null },
    href: { type: String, default: null },
  },
};
</script>

<style lang="scss" scoped>
@use "../../../styles/variables";
@use "../../../styles/typography";

.panel-item {
  margin: 8px;
  padding: 8px 2px 8px 12px;
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
  color: rgba(variables.$color-white, 0.95);
  font-weight: 300;
  -webkit-transition: 0.4s;
  transition: 0.4s;
  opacity: 0.75;
  letter-spacing: 0.5px;

  @extend %face-sans-15-medium;

  &:hover {
    opacity: 1;
    background: rgba(variables.$color-white, 0.1);

    &,
    ::v-deep svg {
      color: variables.$color-white;
    }
  }

  .panel-item-left,
  .panel-item-right {
    display: inline-flex;
    align-items: center;
  }

  .panel-item-left {
    ::v-deep .icon {
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
      color: variables.$color-white;
    }

    .arrow-right,
    .external-link {
      margin-right: 4px;
      width: 26px;
      height: 26px;

      opacity: 0.5;
    }
  }
}
</style>
