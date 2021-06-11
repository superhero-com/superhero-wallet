<template>
  <div class="tabs-menu">
    <ButtonPlain
      v-for="{ text, name } in tabOptions"
      :key="name"
      :class="{ active: name === value }"
      @click="$emit('input', name)"
    >
      {{ text }}
    </ButtonPlain>
  </div>
</template>

<script>
import ButtonPlain from './ButtonPlain';

export default {
  components: { ButtonPlain },
  props: {
    tabOptions: { type: Array, default: null },
    value: { type: [String, Number], default: '' },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.tabs-menu {
  padding: 0 15px;
  background-color: variables.$color-bg-3;

  .button-plain {
    font-size: 16px;
    padding: 5.5px 0;
    margin-right: 17px;
    color: variables.$color-dark-grey;
    display: inline-block;

    @extend %face-sans-15-medium;

    &:hover {
      color: variables.$color-light-grey;
    }

    &.active {
      color: variables.$color-green;
      border-bottom: 1px solid variables.$color-green;
    }

    &:last-child {
      margin-right: 0;
    }
  }
}
</style>
