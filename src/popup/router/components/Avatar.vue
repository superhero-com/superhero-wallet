<template>
  <img class="avatar" :src="error ? avatar : profileImage" :class="size" @error="error = true" />
</template>

<script>
import { mapState } from 'vuex';

export default {
  props: {
    address: { type: String, required: true },
    name: { type: [String, Boolean], default: '' }, // TODO: Name shouldn't be boolean
    size: {
      type: String,
      default: 'normal',
    },
    src: { type: String },
  },
  data: () => ({
    error: false,
  }),
  computed: mapState({
    profileImage(state, { getProfileImage }) {
      if (this.address.startsWith('ct_') || this.address === '') {
        return this.src || '';
      }
      return getProfileImage(this.address);
    },
    avatar(state, { getAvatar }) {
      return getAvatar(this.name || this.address);
    },
  }),
};
</script>

<style lang="scss" scoped>
$x-small-size: 20px;
$small-size: 30px;
$mid-size: 36px;
$normal-size: 38px;
$x-lg-size: 56px;
$lg-size: 64px;

.avatar {
  width: $normal-size;
  height: $normal-size;
  border-radius: 50%;
  overflow: hidden;
  display: inline-block;
  object-fit: cover;
  flex-shrink: 0;

  &.lg {
    height: $lg-size;
    width: $lg-size;
  }

  &.small {
    height: $small-size;
    width: $small-size;
  }

  &.x-small {
    height: $x-small-size;
    width: $x-small-size;
  }

  &.mid {
    height: $mid-size;
    width: $mid-size;
  }

  &.xlg {
    height: $x-lg-size;
    width: $x-lg-size;
  }
}
</style>
