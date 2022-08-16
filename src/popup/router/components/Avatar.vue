<template>
  <img
    class="avatar"
    :src="error ? avatar : profileImage"
    :class="size"
    @error="error = true"
  >
</template>

<script>
import { mapState } from 'vuex';

const SIZES = ['xs', 'sm', 'md', 'rg', 'xl', 'lg'];

export default {
  props: {
    address: { type: String, default: '' },
    name: { type: [String, Boolean], default: '' }, // TODO: Name shouldn't be boolean
    size: {
      type: String,
      default: 'rg',
      validate: (val) => SIZES.includes(val),
    },
    src: { type: String, default: '' },
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
$size-xs: 18px;
$size-sm: 24px;
$size-md: 32px;
$size-rg: 40px;
$size-xl: 56px;
$size-lg: 64px;

.avatar {
  width: $size-rg;
  height: $size-rg;
  border-radius: 50%;
  overflow: hidden;
  display: inline-block;
  object-fit: cover;
  user-select: none;
  flex-shrink: 0;

  &.lg {
    height: $size-lg;
    width: $size-lg;
  }

  &.sm {
    height: $size-sm;
    width: $size-sm;
  }

  &.xs {
    height: $size-xs;
    width: $size-xs;
  }

  &.md {
    height: $size-md;
    width: $size-md;
  }

  &.xl {
    height: $size-xl;
    width: $size-xl;
  }
}
</style>
