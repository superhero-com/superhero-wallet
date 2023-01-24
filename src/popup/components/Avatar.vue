<template>
  <img
    class="avatar"
    :src="error ? avatar : profileImage"
    :class="[size, { 'with-border': withBorder }]"
    :style="avatarStyle"
    @error="error = true"
  >
</template>

<script>
import { mapState } from 'vuex';
import { getAddressColor } from '../utils/avatar';

const SIZES = ['xs', 'sm', 'rg', 'md', 'lg', 'xl'];

export default {
  props: {
    address: { type: String, default: '' },
    name: { type: [String, Boolean], default: '' }, // TODO: Name shouldn't be boolean
    size: {
      type: String,
      default: 'rg',
      validator: (val) => SIZES.includes(val),
    },
    src: { type: String, default: '' },
    withBorder: Boolean,
    colorfulBorder: Boolean,
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
    color() {
      return this.address ? getAddressColor(this.address) : null;
    },
    avatarStyle() {
      if (!this.colorfulBorder) return null;

      return {
        'border-color': this.color,
      };
    },
  }),
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

$size-xs: 18px;
$size-sm: 24px;
$size-md: 32px;
$size-rg: 40px;
$size-lg: 48px;
$size-xl: 56px;

.avatar {
  width: $size-rg;
  height: $size-rg;
  border-radius: 50%;
  overflow: hidden;
  display: inline-block;
  object-fit: cover;
  user-select: none;
  flex-shrink: 0;

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

  &.lg {
    height: $size-lg;
    width: $size-lg;
  }

  &.xl {
    height: $size-xl;
    width: $size-xl;
  }

  &.with-border {
    border: 1px solid variables.$color-grey-border-avatar;
  }
}
</style>
