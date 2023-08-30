<template>
  <ion-page>
    <ion-router-outlet :animated="!RUNNING_IN_TESTS" />
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUpdated } from 'vue';
import { IonRouterOutlet, IonPage } from '@ionic/vue';
import { useRoute } from 'vue-router';
import { useUi } from '@/composables';
import { RUNNING_IN_TESTS } from '@/constants';
import { ROUTE_ACCOUNT, ROUTE_MULTISIG_ACCOUNT } from '../router/routeNames';

export default defineComponent({
  components: {
    IonRouterOutlet,
    IonPage,
  },
  setup() {
    const route = useRoute();

    const { setHomeRouteName } = useUi();

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

    return {
      RUNNING_IN_TESTS,
    };
  },
});
</script>
