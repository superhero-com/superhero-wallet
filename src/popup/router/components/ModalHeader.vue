<template>
  <div class="modal-header">
    <h1 v-if="title">
      {{ title }}
    </h1>
    <h2 v-if="subtitle">
      {{ subtitle }}
    </h2>
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

  h1 {
    @extend %face-sans-18-bold;

    color: variables.$color-white;
    margin-block: 0;
    margin-bottom: 8px;
  }

  h2 {
    @extend %face-sans-16-regular;

    margin-block: 0;
    line-height: 24px;
    margin-bottom: 12px;
    color: rgba(variables.$color-white, 0.75);
  }
}
</style>
