<template>
  <Component
    :is="(href) ? 'LinkButton' : 'div'"
    :href="href"
    :is-external="isExternalLink"
    :class="{
      clickable: !!href,
      'is-external': isExternalLink,
    }"
    class="panel-table-item"
  >
    <div class="name">
      {{ name }}
    </div>
    <div class="value">
      <slot />
    </div>
  </Component>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import LinkButton from '@/popup/components/LinkButton.vue';

export default defineComponent({
  components: {
    LinkButton,
  },
  props: {
    name: { type: String, required: true },
    href: { type: String, default: null },
    isExternalLink: Boolean,
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.panel-table-item {
  width: 100%;
  min-height: 48px;
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  padding: 4px 16px;
  transition: $transition-interactive;

  &:nth-child(even) {
    background-color: rgba($color-black, 0.1);
  }

  .name,
  .value,
  .value .icon {
    transition: inherit;
  }

  .name {
    @extend %face-sans-15-regular;

    margin-right: auto;
    color: rgba($color-white, 0.75);
    font-weight: 400;
    text-align: left;
    word-break: keep-all;
  }

  .value {
    @extend %face-sans-14-light;

    display: inline-flex;
    align-items: center;
    text-align: right;
    color: rgba($color-white, 1);
    overflow-x: auto;

    .icon {
      width: 24px;
      height: 24px;
      opacity: 0.5;
      margin-left: 4px;
      margin-right: -4px;
    }
  }

  &.clickable {
    position: relative;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      background-color: rgba($color-black, 0.16);

      .name {
        color: $color-white;
      }

      .value {
        text-decoration: underline;

        .icon {
          opacity: 1;
        }
      }
    }

    &:active {
      background-color: rgba($color-black, 0.4);
    }
  }

  &.is-external {
    padding-right: 10px; // Compensate external link icon margin
  }
}
</style>
