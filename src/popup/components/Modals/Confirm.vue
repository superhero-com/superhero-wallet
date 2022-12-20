<template>
  <Default
    v-bind="{ ...$attrs, resolve }"
    :close="cancel"
  >
    <template #msg>
      <TemplateRenderer
        :str="msg"
      />
    </template>
    <template #footer>
      <BtnMain
        variant="muted"
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
    msg: { type: String, default: '' },
  },
  methods: {
    cancel() {
      this.reject(new Error('Rejected by user'));
    },
  },
};
</script>
