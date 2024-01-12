<template>
  <IonPage>
    <IonContent class="account-ion-content">
      <AccountDetailsBase
        v-if="isPageActive"
        class="account-details"
      />
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  PropType,
  defineComponent,
  ref,
  watch,
} from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { IonicLifecycleStatus } from '@/types';
import { PROTOCOL_VIEW_ACCOUNT_DETAILS } from '@/constants';
import AccountDetailsBase from '@/popup/components/AccountDetailsBase.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_ACCOUNT_DETAILS,
  components: {
    AccountDetailsBase,
    IonPage,
    IonContent,
  },
  props: {
    ionicLifecycleStatus: { type: String as PropType<IonicLifecycleStatus>, default: null },
  },
  setup(props) {
    const isPageActive = ref(false);

    watch(() => props.ionicLifecycleStatus, (status) => {
      if (status === 'didEnter') {
        isPageActive.value = true;
      } else if (status === 'didLeave') {
        isPageActive.value = false;
      }
    });

    return {
      isPageActive,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables';

.account-ion-content {
  overflow: hidden;
  background-color: variables.$color-bg-4;
}
</style>
