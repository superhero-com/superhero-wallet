<template>
  <AccountInfoCard
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
} from '@vue/composition-api';

import type { IAccount } from '../../types';
import { ROUTE_ACCOUNT_DETAILS } from '../router/routeNames';
import { useSdk } from '../../composables';
import { ACCOUNT_AIR_GAP_WALLET, aettosToAe } from '../utils';
import AccountInfoCard from './AccountInfoCard.vue';

export default defineComponent({
  components: {
    AccountInfoCard,
  },
  props: {
    account: { type: Object as PropType<IAccount>, required: true },
  },
  setup(props, { root }) {
    const { getSdk } = useSdk({ store: root.$store });
    const balance = ref(new BigNumber(0));

    const numericBalance = computed<number>(() => balance.value.toNumber());
    const isAirGapAccount = computed((): boolean => props.account.type === ACCOUNT_AIR_GAP_WALLET);

    onMounted(async () => {
      const sdk = await getSdk();
      const fetchedBalance = await sdk.balance(props.account.address);
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
