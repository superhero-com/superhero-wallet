<template>
  <div
    class="account-item"
  >
    <Avatar
      :address="address"
      :name="name"
      size="sm"
    />

    <span
      v-if="name"
      class="name"
      v-text="name"
    />
    <AddressTruncated
      v-else
      show-explorer-link
      :address="address"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

import AddressTruncated from './AddressTruncated.vue';
import Avatar from './Avatar.vue';

export default defineComponent({
  components: {
    Avatar,
    AddressTruncated,
  },
  props: {
    address: { type: String, required: true },
    name: { type: String, default: '' },
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.account-item {
  display: flex;
  align-items: center;

  .avatar {
    margin-right: 8px;
  }
}
</style>
