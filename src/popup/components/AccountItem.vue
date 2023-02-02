<template>
  <LinkButton
    :to="explorerUrl"
    target="_blank"
    class="account-item"
  >
    <Avatar
      :address="address"
      :name="name"
      size="sm"
    />

    <span
      v-if="name"
      class="name address"
      v-text="name"
    />
    <AddressTruncated
      v-else
      class="address"
      :address="address"
    />

    <ExternalLinkIcon class="external-link-icon" />
  </LinkButton>
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
    margin-right: 4px;
  }

  .address {
    @extend %face-mono-10-medium;

    text-align: left;
    word-break: break-all;
  }

  .external-link-icon {
    width: 22px;
    height: 22px;
  }

  .icon,
  .address {
    color: variables.$color-white;
    opacity: 0.85;
  }

  &:hover {
    .icon,
    .address {
      color: variables.$color-white;
      opacity: 1;
    }
  }
}
</style>
