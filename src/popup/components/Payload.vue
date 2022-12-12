<template>
  <div
    v-if="payload && payload.length"
    class="payload"
  >
    <div class="payload-header">
      <span>Payload</span>
      <slot />
    </div>

    <div class="payload-text">
      {{ payload }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'Payload',
  props: {
    payload: { type: String, default: '' },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.payload {
  @extend %face-sans-14-medium;

  width: 100%;
  text-align: left;
  margin-top: 16px;

  .payload-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    span {
      opacity: 0.5;
    }
  }

  .payload-text {
    margin-top: 4px;
    margin-bottom: 4px;
  }
}
</style>
