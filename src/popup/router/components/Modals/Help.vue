<template>
  <Default
    icon="info"
    v-bind="$attrs"
  >
    <TemplateRenderer
      slot="msg"
      :node="templateRootNode"
    />
  </Default>
</template>

<script>
import Default from './Default';
import TemplateRenderer from '../TemplateRenderer';

export default {
  components: { Default, TemplateRenderer },
  computed: {
    templateRootNode() {
      return new DOMParser()
        .parseFromString(`<root>${this.$attrs.msg || ''}</root>`, 'text/xml').childNodes[0];
    },
  },
};
</script>
