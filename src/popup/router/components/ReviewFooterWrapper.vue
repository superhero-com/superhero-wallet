<template>
  <div class="review-buttons">
    <slot />
  </div>
</template>

<script>
export default {
  props: {
    submitDisabled: Boolean,
    editParams: { type: Object, default: () => ({}) },
    submitParams: { type: Object, default: () => ({}) },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/mixins';

.review-buttons {
  @include mixins.flex(space-between, center);

  background: variables.$modal-footer-gradient;
  padding: 24px 16px;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  gap: 8px;

  .button {
    @include mixins.flex(center, center);

    margin: 0;
  }

  .arrow-send {
    width: 20px;
    height: 20px;
    margin-right: 4px;
  }

  .btn-secondary-action {
    flex-basis: 40%;
  }

  .btn-primary-action {
    flex-basis: 60%;
  }
}
</style>
