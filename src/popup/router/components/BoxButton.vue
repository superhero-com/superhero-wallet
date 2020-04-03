<template>
  <div class="button-container">
    <div class="button-content" @click="handleClick">
      <slot name="icon" />
      <span class="button-text" :class="accent ? 'button-text-accent' : ''">{{ text }}</span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      required: true,
    },
    to: String,
    accent: Boolean,
  },
  methods: {
    handleClick() {
      return this.to ? this.$router.push(`/${this.to}`) : this.$emit('handleClick');
    },
  },
};
</script>
<style lang="scss">
@import '../../../common/variables';

.button-container {
  width: 33%;
  display: inline-block;
  padding: 10px;

  .button-content {
    background: $box-button-color;
    border-radius: 5px;
    padding: 15px 10px;
    border: 1px solid transparent;

    &:hover {
      background-color: $secondary-color;
      cursor: pointer;
    }

    &:hover .button-text {
      color: $white-color !important;
    }

    .button-text {
      font-size: 15px;
      display: block;
      font-weight: bold;
      margin-top: 5px;

      &.button-text-accent {
        color: $accent-color;
      }
    }
  }
}
</style>
