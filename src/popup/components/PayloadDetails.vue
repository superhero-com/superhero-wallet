<template>
  <div
    v-if="payload && payload.length"
    class="payload"
  >
    <div class="payload-header">
      <span
        class="text-text"
        v-text="$t('modals.send.payload')"
      />
      <slot />
    </div>

    <div
      class="payload-text"
      v-text="payload"
    />
  </div>
</template>

<script>
export default {
  name: 'PayloadDetails',
  props: {
    payload: { type: String, default: '' },
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.payload {
  text-align: left;
  width: 100%;

  .payload-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .payload-text {
    @extend %face-sans-15-regular;

    color: $color-white;
    opacity: 0.85;
  }
}
</style>
