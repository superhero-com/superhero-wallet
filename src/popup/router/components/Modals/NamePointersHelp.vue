<template>
  <Default
    :title="$t('modals.name-pointers-help.title')"
    icon="info"
    v-bind="$attrs"
  >
    <i18n
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
};
</script>
