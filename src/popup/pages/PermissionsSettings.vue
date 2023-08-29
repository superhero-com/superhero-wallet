<template>
  <div class="permissions-settings">
    <i18n-t
      keypath="pages.permissions.description"
      tag="div"
      class="text-description"
      scope="global"
    >
      <LinkButton
        to="https://superhero.com/"
      >
        superhero.com
      </LinkButton>
    </i18n-t>

    <div class="hosts">
      <PanelItem
        v-for="permission in permissions"
        :key="permission.host"
        class="host"
        :to="{ name: 'permissions-details', params: { host: permission.host } }"
        :title="permission.name"
      />
    </div>

    <BtnMain
      extend
      variant="muted"
      :text="$t('pages.permissions.add')"
      :to="{ name: 'permissions-add' }"
      :icon="PlusIcon"
    />
  </div>
</template>

<script lang="ts">
import { useStore } from 'vuex';
import { computed } from 'vue';

import LinkButton from '@/popup/components/LinkButton.vue';
import PanelItem from '../components/PanelItem.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import PlusIcon from '../../icons/plus-circle-fill.svg?vue-component';

export default {
  components: {
    LinkButton,
    PanelItem,
    BtnMain,
  },
  setup() {
    const store = useStore();
    const permissions = computed(() => Object.values(store.state.permissions));

    return {
      PlusIcon,
      permissions,
    };
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.permissions-settings {
  padding: var(--screen-padding-x);

  .hosts {
    margin-bottom: 26px;

    .host {
      margin: 8px 0;
    }
  }
}
</style>
