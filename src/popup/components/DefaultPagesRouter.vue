<template>
  <RouterView />
</template>

<script lang="ts">
import {
  defineComponent, onMounted, onUpdated,
} from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useUi } from '../../composables';
import { ROUTE_ACCOUNT, ROUTE_MULTISIG_ACCOUNT } from '../router/routeNames';

export default defineComponent({
  setup() {
    const store = useStore();
    const route = useRoute();

    const { setHomeRouteName } = useUi({ store });

    function setHomeRoute() {
      const [rootRoute] = route.matched;

      setHomeRouteName(
        rootRoute.meta.isMultisig
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
