<template>
  <Default
    v-bind="{ ...$attrs, resolve }"
    class="confirm-modal"
    icon="info"
    :msg="msg"
    :title="title"
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
        extra-padded
        :text="$t('common.cancel')"
        @click="cancel"
      />
      <BtnMain
        data-cy="to-confirm"
        :text="buttonMessage || $t('common.confirm')"
        @click="resolve"
      />
    </template>
  </Default>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { RejectCallback, ResolveCallback } from '@/types';
import { RejectedByUserError } from '@/lib/errors';

import Default from './Default.vue';
import BtnMain from '../buttons/BtnMain.vue';
import TemplateRenderer from '../TemplateRenderer.vue';

export default defineComponent({
  components: {
    Default,
    TemplateRenderer,
    BtnMain,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    title: { type: String, default: '' },
    msg: { type: String, default: '' },
    buttonMessage: { type: String, default: '' },
  },
  setup(props) {
    function cancel() {
      props.reject(new RejectedByUserError());
    }

    return {
      cancel,
    };
  },
});
</script>
