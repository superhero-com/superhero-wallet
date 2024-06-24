<template>
  <div class="address-book-item">
    <AccountInfo
      :account="account"
      :custom-name="item.name"
      show-protocol-icon
      use-address-for-avatar
    />
    <ArrowRight class="arrow" />
  </div>
</template>

<script lang="ts">
import {
  PropType,
  computed,
  defineComponent,
} from 'vue';

import type { IAccount, IAddressBookEntry } from '@/types';
import { ROUTE_ADDRESS_BOOK_EDIT } from '@/popup/router/routeNames';

import AccountInfo from '@/popup/components/AccountInfo.vue';

import ArrowRight from '@/icons/arrow-right.svg?vue-component';

export default defineComponent({
  components: {
    AccountInfo,
    ArrowRight,
  },
  props: {
    item: { type: Object as PropType<IAddressBookEntry>, required: true },
  },
  setup(props) {
    const account = computed((): Partial<IAccount> => ({
      address: props.item.address,
      protocol: props.item.protocol,
    }));
    return {
      account,
      ROUTE_ADDRESS_BOOK_EDIT,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.address-book-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: $border-radius-interactive;
  padding: 12px 8px;
  background-color: rgba($color-white, 0.08);
  cursor: pointer;
  transition: $transition-interactive;

  &:hover {
    background-color: rgba($color-white, 0.06);
  }

  .arrow {
    width: 24px;
    height: 24px;
    opacity: 0.5;
  }
}
</style>
