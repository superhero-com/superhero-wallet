<template>
  <img :src="avatarUrl" class="user-avatar" :class="size" />
</template>

<script>
import { BACKEND_URL } from '../../utils/constants';

export default {
  props: {
    address: String,
    size: String,
  },
  computed: {
    avatarUrl() {
      return `${BACKEND_URL}/profile/image/${this.address}`;
    },
  },
};
</script>

<style scoped>
.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
}
.user-avatar.lg {
  height: 4rem;
  width: 4rem;
}
</style>
