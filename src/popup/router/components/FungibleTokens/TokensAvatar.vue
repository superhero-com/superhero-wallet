<template>
  <img
    :src="src ? src : generatedIcon.src"
    class="token-identicon"
    :class="[size, src ? 'with-image' : '']"
  />
</template>

<script>
import jdenticon from 'jdenticon';

import { IDENTICON_CONFIG, IDENTICON_SIZES } from '../../../utils/constants';

export default {
  props: {
    address: String,
    size: {
      type: String,
      default: 'mid',
    },
    src: String,
  },
  computed: {
    generatedIcon() {
      jdenticon.config = IDENTICON_CONFIG;
      return {
        type: 'identicon',
        src: `data:image/svg+xml;base64,${btoa(
          jdenticon.toSvg(this.address, IDENTICON_SIZES[this.size]),
        )}`,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../../common/variables';

$mid-size: 36px;
$x-lg: 56px;

.token-identicon {
  width: $mid-size;
  height: $mid-size;
  min-width: $mid-size;
  min-height: $mid-size;
  border-radius: 50%;
  object-fit: cover;
  background-color: black;

  &.with-image {
    object-fit: scale-down;
  }

  &.x-lg {
    width: $x-lg;
    height: $x-lg;
    min-width: $x-lg;
    min-height: $x-lg;
  }
}
</style>
