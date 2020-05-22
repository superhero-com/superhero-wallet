<template>
  <img v-if="!error && !identicon" :src="profileImage" class="user-avatar" :class="size" @error="error = true" />
  <img v-else-if="avatar.type === 'avatar'" :src="avatar.src" class="user-avatar" :class="size" />
  <div
    v-else-if="avatar.type === 'identicon'"
    v-html="avatar.src"
    class="user-identicon"
    :class="size"
  />
</template>

<script>
import jdenticon from 'jdenticon';
import Avatars from '@dicebear/avatars';
import sprites from '@dicebear/avatars-avataaars-sprites';
import {
  BACKEND_URL,
  IDENTICON_CONFIG,
  IDENTICON_SIZES,
  AVATAR_CONFIG,
} from '../../utils/constants';

export default {
  props: {
    address: String,
    name: [String, Boolean],
    size: {
      type: String,
      default: 'normal',
    },
    identicon: Boolean,
  },
  data: () => ({
    error: false,
  }),
  computed: {
    profileImage() {
      return `${BACKEND_URL}/profile/image/${this.address}`;
    },
    avatar() {
      if (this.name) {
        const avatars = new Avatars(sprites, AVATAR_CONFIG);
        return {
          type: 'avatar',
          src: avatars.create(this.name),
        };
      }
      jdenticon.config = IDENTICON_CONFIG;
      return {
        type: 'identicon',
        src: jdenticon.toSvg(this.address, IDENTICON_SIZES[this.size]),
      };
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
