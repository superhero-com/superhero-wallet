<template>
  <TransactionDetailsContent
    v-if="transaction"
    :transaction="transaction"
    :hash="hash"
  />
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  PropType,
  ref,
} from '@vue/composition-api';
import { ITransaction } from '../../types';
import { useGetter, useMiddleware } from '../../composables';
import TransactionDetailsContent from './TransactionDetailsContent.vue';

export default defineComponent({
  name: 'TransactionDetails',
  components: {
    TransactionDetailsContent,
  },
  props: {
    hash: { type: String as PropType<string>, required: true },
  },
  setup(props, { root }) {
    const { getMiddleware } = useMiddleware(root.$store);
    const transaction = ref<ITransaction | null>(null);
    const getTx = useGetter('getTx');

    onMounted(async () => {
      transaction.value = getTx.value(props.hash);
      if (!transaction.value || transaction.value?.incomplete) {
        const middleware = await getMiddleware();
        transaction.value = await middleware.getTxByHash(props.hash);
        root.$store.commit('setTransactionByHash', transaction.value);
      }
    });

    return {
      transaction,
    };
  },
});
</script>
