<template>
  <Default
    v-bind="{ ...$attrs, resolve }"
    :close="cancel"
  >
    <TemplateRenderer
      v-if="!$slots.msg"
      slot="msg"
      :str="$attrs.msg"
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
import Default from './Default.vue';
import Button from '../Button.vue';
import TemplateRenderer from '../TemplateRenderer.vue';

export default {
  components: { Default, TemplateRenderer, Button },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  methods: {
    cancel() {
      this.reject(new Error('Rejected by user'));
    },
  },
};
</script>
