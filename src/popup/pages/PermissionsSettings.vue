<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="permissions-settings">
        <i18n-t
          keypath="pages.permissions.description"
          tag="div"
          class="text-description"
          scope="global"
        >
          <LinkButton href="https://superhero.com/">superhero.com</LinkButton>
        </i18n-t>

        <div class="hosts">
          <PanelItem
            v-for="permission in permissions"
            :key="permission.host"
            class="host"
            :to="{ name: ROUTE_PERMISSIONS_DETAILS, params: { host: permission.host } }"
            :title="permission.name"
          />
        </div>

        <BtnMain
          extend
          variant="muted"
          :text="$t('pages.permissions.add')"
          :to="{ name: ROUTE_PERMISSIONS_ADD }"
          :icon="PlusIcon"
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { usePermissions } from '@/composables/permissions';
import { ROUTE_PERMISSIONS_ADD, ROUTE_PERMISSIONS_DETAILS } from '@/popup/router/routeNames';

import LinkButton from '@/popup/components/LinkButton.vue';
import PanelItem from '../components/PanelItem.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import PlusIcon from '../../icons/plus-circle-fill.svg?vue-component';

export default defineComponent({
  components: {
    LinkButton,
    PanelItem,
    BtnMain,
    IonPage,
    IonContent,
  },
  setup() {
    const { permissions } = usePermissions();

    return {
      ROUTE_PERMISSIONS_ADD,
      ROUTE_PERMISSIONS_DETAILS,
      PlusIcon,
      permissions,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.permissions-settings {
  padding-inline: var(--screen-padding-x);

  .hosts {
    margin-bottom: 26px;

    .host {
      margin: 8px 0;
    }
  }
}
</style>
