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
      <BtnMain
        variant="secondary"
        @click="cancel"
      >
        {{ $t('modals.cancel') }}
      </BtnMain>
      <BtnMain
        data-cy="to-confirm"
        @click="resolve"
      >
        {{ $t('modals.confirm') }}
      </BtnMain>
    </template>
  </Default>
</template>

<script>
import Default from './Default.vue';
import BtnMain from '../buttons/BtnMain.vue';
import TemplateRenderer from '../TemplateRenderer.vue';

export default {
  components: {
    Default,
    TemplateRenderer,
    BtnMain,
  },
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
