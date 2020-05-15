<template>
  <img :src="avatarUrl" class="user-avatar" :class="size" @error="error = true" v-if="!error" />
  <div v-html="identicon" class="user-identicon" :class="size" v-else />
</template>

<script>
import jdenticon from 'jdenticon';
import { BACKEND_URL, IDENTICON_CONFIG, IDENTICON_SIZES } from '../../utils/constants';

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
      jdenticon.config = IDENTICON_CONFIG;
      return jdenticon.toSvg(this.address, IDENTICON_SIZES[this.size]);
    },
  },
};
</script>

<style lang="scss" scoped>
$small-size: 30px;
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

  &.small {
    height: $small-size;
    width: $small-size;
  }
}
</style>
