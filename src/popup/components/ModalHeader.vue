<template>
  <div class="modal-header">
    <h2
      v-if="title || $slots.title"
      class="title text-heading-2"
    >
      <slot name="title">
        {{ title }}
      </slot>
    </h2>

    <h3
      v-if="subtitle || $slots.subtitle"
      class="subtitle"
      :class="{ 'with-margin': !disableSubtitleMargin }"
    >
      <slot name="subtitle">
        {{ subtitle }}
      </slot>
    </h3>
  </div>
</template>

<script>
export default {
  props: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    disableSubtitleMargin: Boolean,
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.modal-header {
  width: 100%;
  text-align: center;
  padding: 0 16px;

  .subtitle {
    @extend %face-sans-16-regular;

    margin-block: 0;
    line-height: 24px;
    color: rgba($color-white, 0.75);

    a {
      font-weight: 500;
      color: $color-primary;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    &.with-margin {
      margin-bottom: 1em;
    }
  }
}
</style>
