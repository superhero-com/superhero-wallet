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
      :address="address"
    />

    <LinkButton
      v-if="explorerUrl"
      :to="explorerUrl"
      target="_blank"
      class="external-link"
    >
      <ExternalLinkIcon class="external-link-icon" />
    </LinkButton>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import type { INetwork } from '../../types';
import { useGetter } from '../../composables/vuex';

import AddressTruncated from './AddressTruncated.vue';
import Avatar from './Avatar.vue';
import ExternalLinkIcon from '../../icons/external-link.svg?vue-component';
import LinkButton from './LinkButton.vue';

export default defineComponent({
  components: {
    Avatar,
    AddressTruncated,
    ExternalLinkIcon,
    LinkButton,
  },
  props: {
    address: { type: String, required: true },
    name: { type: String, default: '' },
  },
  setup(props) {
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const explorerUrl = computed(
      () => (props.address)
        ? `${activeNetwork.value.explorerUrl}/account/transactions/${props.address}`
        : null,
    );

    return {
      explorerUrl,
    };
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

  .address {
    @extend %face-mono-10-medium;

    color: variables.$color-grey-light;
    text-align: left;
    word-break: break-all;
  }

  .external-link {
    color: inherit;
    flex-shrink: 0;

    .external-link-icon {
      width: 22px;
      height: 22px;
    }
  }
}
</style>
