<template>
  <a class="link-button" :href="to" target="blank" @click="handleClick">
    <slot />
  </a>
</template>

<script>
import openUrl from '../../utils/openUrl';

export default {
  name: 'LinkButton',
  props: {
    to: { type: String, required: true },
  },
  methods: {
    handleClick(e) {
      if (process.env.PLATFORM === 'cordova') {
        e.preventDefault();
        openUrl(this.to);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';
@import '../../../styles/typography';

.link-button {
  padding: 0;
  display: inline-flex;
  align-items: center;

  @extend %face-sans-14-regular;

  color: $color-green;

  svg {
    width: 24px;
    height: 24px;
    margin-right: 4px;
    opacity: 0.44;
    color: $color-white;
  }

  &:hover {
    color: $color-green-hover;

    svg {
      opacity: 1;
      color: $color-green;
    }
  }

  &:active {
    opacity: 0.7;

    svg {
      opacity: 0.7;
      color: $color-green;
    }
  }
}
</style>
