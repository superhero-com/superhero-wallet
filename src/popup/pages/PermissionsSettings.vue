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
            :title="permission.name"
            class="host"
            @click="manage(permission.host)"
          />
        </div>

        <BtnMain
          extend
          variant="muted"
          :text="$t('pages.permissions.add')"
          :icon="PlusIcon"
          @click="manage()"
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import { MODAL_PERMISSION_MANAGER } from '@/constants';
import { usePermissions } from '@/composables/permissions';
import { useModals } from '@/composables';

import LinkButton from '@/popup/components/LinkButton.vue';
import PanelItem from '@/popup/components/PanelItem.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';

import PlusIcon from '@/icons/plus-circle.svg?vue-component';

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
    const { openModal } = useModals();

    function manage(host?: string) {
      openModal(MODAL_PERMISSION_MANAGER, { host });
    }

    return {
      PlusIcon,
      permissions,
      manage,
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
