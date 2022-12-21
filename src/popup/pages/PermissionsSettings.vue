<template>
  <div class="permissions-settings">
    <i18n
      path="pages.permissions.description"
      tag="div"
      class="text-description"
    >
      <a
        href="https://superhero.com/"
        target="_blank"
      >
        superhero.com
      </a>
    </i18n>

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
      has-icon
      extend
      variant="secondary"
      :to="{ name: 'permissions-add' }"
    >
      <PlusIcon />
      {{ $t('pages.permissions.add') }}
    </BtnMain>
  </div>
</template>

<script>
import PanelItem from '../components/PanelItem.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import PlusIcon from '../../icons/plus-circle-fill.svg?vue-component';

export default {
  components: {
    PanelItem,
    BtnMain,
    PlusIcon,
  },
  computed: {
    permissions() {
      return Object.values(this.$store.state.permissions);
    },
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
