<template>
  <RouterView />
</template>

<script lang="ts">
import { defineComponent, onMounted, onUpdated } from '@vue/composition-api';
import { useUi } from '../../composables';
import { ROUTE_ACCOUNT, ROUTE_MULTISIG_ACCOUNT, ROUTE_MULTISIG_DEFAULT_PAGES } from '../router/routeNames';

export default defineComponent({
  setup(props, { root }) {
    const { setHomeRouteName } = useUi({ store: root.$store });

    function setHomeRoute() {
      const [rootRoute] = root.$route.matched;

      setHomeRouteName(
        rootRoute.name === ROUTE_MULTISIG_DEFAULT_PAGES
          ? ROUTE_MULTISIG_ACCOUNT
          : ROUTE_ACCOUNT,
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
