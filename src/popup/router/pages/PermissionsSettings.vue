<template>
  <div class="permissions-settings">
    <i18n
      path="pages.permissions.description"
      tag="div"
      class="description"
    >
      <a
        href="https://superhero.com/"
        target="_blank"
      >
        superhero.com
      </a>
    </i18n>
    <template v-if="hosts.length">
      <PanelItem
        v-for="host in hosts"
        :key="host"
        class="host"
        :to="{ name: 'permissions-details', params: { host } }"
        :title="host"
      />
    </template>
    <div v-else>
      {{ $t('pages.permissions.empty') }}
    </div>
  </div>
</template>

<script>
import PanelItem from '../components/PanelItem.vue';

export default {
  components: {
    PanelItem,
  },
  computed: {
    hosts() {
      return Object.keys(this.$store.state.permissions);
    },
  },
};
</script>

<style lang="scss" scoped>
  @use '../../../styles/variables';
  @use '../../../styles/typography';

  .permissions-settings {
    padding: 6px;

    .description {
      color: rgba(variables.$color-white, 0.75);
      padding: 8px 8px 12px 8px;
      line-height: 20px;

      a {
        color: variables.$color-primary;
        text-decoration: none;
      }

      @extend %face-sans-14-light;
    }
  }

</style>
