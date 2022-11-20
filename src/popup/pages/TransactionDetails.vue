<template>
  <TransactionDetailsContent
    v-if="transaction"
    :transaction="transaction"
    :hash="hash"
  />
</template>

<script lang="ts">
import {
  computed, defineComponent, onMounted, PropType, ref,
} from '@vue/composition-api';
import {
  watchUntilTruthy,
} from '../utils';

import { ITransaction } from '../../types';
import store from '../../store';
import TransactionDetailsContent from './TransactionDetailsContent.vue';

export default defineComponent({
  name: 'TransactionDetails',
  components: {
    TransactionDetailsContent,
  },
  props: {
    hash: { type: String as PropType<string>, required: true },
  },
  setup(props) {
    const transaction = ref<ITransaction | null>(null);

    const getTx = computed(() => store.getters.getTx);

    const state = computed(() => store.state as any);

    onMounted(async () => {
      transaction.value = getTx.value(props.hash);
      if (!transaction.value || transaction.value?.incomplete) {
        await watchUntilTruthy(() => state.value.middleware);
        transaction.value = await state.value?.middleware.getTxByHash(props.hash);
        store.commit('setTransactionByHash', transaction.value);
      }
    });

    return {
      transaction,
    };
  },
});
</script>
