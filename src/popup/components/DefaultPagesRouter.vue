<template>
  <RouterView />
</template>

<script lang="ts">
import { defineComponent, onMounted, onUpdated } from '@vue/composition-api';
import { useUi } from '../../composables';
import { ROUTE_ACCOUNT, ROUTE_MULTISIG_ACCOUNT } from '../router/routeNames';

export default defineComponent({
  setup(props, { root }) {
    const { setHomeRouteName } = useUi();

    function setHomeRoute() {
      const [rootRoute] = root.$route.matched;

      setHomeRouteName(
        rootRoute.meta.isMultisig
          ? ROUTE_MULTISIG_ACCOUNT
          : ROUTE_ACCOUNT,
        () => root.$store.commit('initTransactions'),
      );
    }

    onUpdated(() => {
      setHomeRoute();
    });

    onMounted(() => {
      setHomeRoute();
    });
  },
});
</script>
