<template>
  <IonPage>
    <!-- We are disabling animations on FF because of a bug that causes flickering
      see: https://github.com/ionic-team/ionic-framework/issues/26620 -->
    <IonRouterOutlet :animated="!RUNNING_IN_TESTS && !IS_FIREFOX" />
  </IonPage>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUpdated } from 'vue';
import { IonRouterOutlet, IonPage } from '@ionic/vue';
import { useRoute } from 'vue-router';
import { useUi } from '@/composables';
import { RUNNING_IN_TESTS, IS_FIREFOX } from '@/constants';
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
      IS_FIREFOX,
    };
  },
});
</script>
