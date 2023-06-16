<template>
  <AccountSelectOptionsItem
    :address="account.address"
    :name="account.name"
    :idx="account.idx"
    :is-air-gap="isAirGapAccount"
  />
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  PropType,
} from 'vue';
import { Encoded } from '@aeternity/aepp-sdk';

import type { IAccount } from '@/types';
import { ACCOUNT_AIR_GAP_WALLET } from '@/constants';
import { aettosToAe } from '@/protocols/aeternity/helpers';
import { useAeSdk } from '@/composables';
import { ROUTE_ACCOUNT_DETAILS } from '@/popup/router/routeNames';

import AccountSelectOptionsItem from './AccountSelectOptionsItem.vue';

export default defineComponent({
  components: {
    AccountSelectOptionsItem,
  },
  props: {
    account: { type: Object as PropType<IAccount>, required: true },
  },
  setup(props) {
    const { getAeSdk } = useAeSdk();
    const balance = ref(new BigNumber(0));

    const numericBalance = computed<number>(() => balance.value.toNumber());
    const isAirGapAccount = computed((): boolean => props.account.type === ACCOUNT_AIR_GAP_WALLET);

    onMounted(async () => {
      const sdk = await getAeSdk();
      const fetchedBalance = await sdk.getBalance(props.account.address as Encoded.AccountAddress);
      balance.value = new BigNumber(aettosToAe(fetchedBalance));
    });

    return {
      numericBalance,
      isAirGapAccount,
      ROUTE_ACCOUNT_DETAILS,
    };
  },
});
</script>
