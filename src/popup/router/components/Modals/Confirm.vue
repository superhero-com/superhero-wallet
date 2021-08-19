<template>
  <Default
    v-bind="{ ...$attrs, resolve }"
    :close="cancel"
  >
    <TemplateRenderer
      v-if="!$slots.msg"
      slot="msg"
      :node="templateRootNode"
    />
    <template slot="footer">
      <Button
        fill="secondary"
        @click="cancel"
      >
        {{ $t('modals.cancel') }}
      </Button>
      <Button
        data-cy="to-confirm"
        @click="resolve"
      >
        {{ $t('modals.confirm') }}
      </Button>
    </template>
  </Default>
</template>

<script>
import Default from './Default';
import Button from '../Button';
import TemplateRenderer from '../TemplateRenderer';

export default {
  components: { Default, TemplateRenderer, Button },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  computed: {
    templateRootNode() {
      return new DOMParser()
        .parseFromString(`<root>${this.$attrs.msg}</root>`, 'text/xml').childNodes[0];
    },
  },
  methods: {
    cancel() {
      this.reject(new Error('Rejected by user'));
    },
  },
};
</script>
