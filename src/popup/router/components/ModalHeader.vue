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
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.modal-header {
  width: 100%;
  text-align: center;

  .subtitle {
    @extend %face-sans-16-regular;

    margin-block: 0;
    line-height: 24px;
    margin-bottom: 1em;
    color: rgba(variables.$color-white, 0.75);

    a {
      font-weight: 500;
      color: variables.$color-blue;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}
</style>
