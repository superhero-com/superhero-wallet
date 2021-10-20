<template>
  <Default
    icon="info"
    v-bind="$attrs"
  >
    <TemplateRenderer
      slot="msg"
      :str="$attrs.msg"
    />
  </Default>
</template>

<script>
import Default from './Default.vue';
import TemplateRenderer from '../TemplateRenderer.vue';

export default {
  components: { Default, TemplateRenderer },
};
</script>
