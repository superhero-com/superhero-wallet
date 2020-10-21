<template>
  <img
    class="user-avatar"
    :src="error ? avatar : profileImage"
    :class="size"
    @error="error = true"
  />
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
  },
  data: () => ({
    error: false,
  }),
  computed: mapState({
    profileImage(state, { getProfileImage }) {
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
$normal-size: 38px;
$lg-size: 64px;

.user-avatar {
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

  &.x-small {
    height: $x-small-size;
    width: $x-small-size;
  }
}
</style>
