<template>
  <Default
    icon="info"
    :title="title"
    v-bind="$attrs"
  >
    <i18n
      v-if="type === 'auctions'"
      slot="msg"
      path="modals.auctions-help.msg"
      tag="span"
    >
      <br>
    </i18n>
    <i18n
      v-else-if="type === 'name-pointers'"
      slot="msg"
      path="modals.name-pointers-help.msg"
      tag="span"
    >
      <br>
    </i18n>
  </Default>
</template>

<script>
import Default from './Default';

export default {
  components: { Default },
  props: {
    type: { type: String, required: true },
  },
  computed: {
    title() {
      switch (this.type) {
        case 'auctions':
          return this.$t('modals.auctions-help.title');
        case 'name-pointers':
          return this.$t('modals.name-pointers-help.title');
        default:
          throw Error('Unsupported help modal type');
      }
    },
  },
};
</script>
