<template>
  <img :src="avatarUrl" class="user-avatar" :class="size" @error="error = true" v-if="!error" />
  <div v-html="identicon" class="user-identicon" :class="size" v-else />
</template>

<script>
import jdenticon from 'jdenticon';
import { BACKEND_URL } from '../../utils/constants';

const identiconSizes = {
  normal: 38,
  lg: 64,
};

export default {
  props: {
    address: String,
    size: {
      type: String,
      default: 'normal',
    },
  },
  data: () => ({
    error: false,
  }),
  computed: {
    avatarUrl() {
      return `${BACKEND_URL}/profile/image/${this.address}`;
    },
    identicon() {
      jdenticon.config = {
        lightness: {
          color: [0.4, 1.0],
          grayscale: [0.5, 1.0],
        },
        saturation: {
          color: 1.0,
          grayscale: 1.0,
        },
        backColor: '#12121bff',
      };

      return jdenticon.toSvg(this.address, identiconSizes[this.size]);
    },
  },
};
</script>

<style lang="scss" scoped>
$normal-size: 38px;
$lg-size: 64px;

.user-avatar,
.user-identicon {
  width: $normal-size;
  height: $normal-size;
  border-radius: 50%;
  overflow: hidden;
  display: inline-block;

  &.lg {
    height: $lg-size;
    width: $lg-size;
  }
}
</style>
