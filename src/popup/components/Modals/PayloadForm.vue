<template>
  <Modal
    from-bottom
    body-without-padding-bottom
    has-close-button
    class="payload-form"
    @close="reject()"
  >
    <div class="header text-heading-2">
      {{ $t('modals.payloadForm.title') }}
    </div>
    <div class="description text-description">
      {{ $t('modals.payloadForm.desc') }}
    </div>
    <div class="wrapper">
      <FormTextarea
        v-model="value"
        size="sm"
        :resizable="false"
      >
        <template #label>
          {{ $t('modals.payloadForm.label') }}
        </template>
      </FormTextarea>
    </div>
    <template #footer>
      <BtnMain
        class="btn-cancel"
        variant="muted"
        extra-padded
        :text="$t('common.cancel')"
        @click="reject()"
      />
      <BtnMain
        :text="$t('modals.payloadForm.doneBtn')"
        :disabled="!value.length"
        @click="resolve(value)"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { ref, defineComponent, PropType } from 'vue';
import type { RejectCallback, ResolveCallback } from '@/types';

import Modal from '../Modal.vue';
import FormTextarea from '../form/FormTextarea.vue';
import BtnMain from '../buttons/BtnMain.vue';

export type PayloadFormResolvedVal = string;

export default defineComponent({
  name: 'PayloadForm',
  components: {
    BtnMain,
    FormTextarea,
    Modal,
  },
  props: {
    resolve: {
      type: Function as PropType<ResolveCallback<PayloadFormResolvedVal>>,
      required: true,
    },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    payload: { type: String, default: '' },
  },
  setup: (props) => ({ value: ref(props.payload) }),
});
</script>

<style lang="scss" scoped>
.payload-form {
  .header {
    text-align: center;
    padding: 8px 16px 4px;
  }

  .description {
    margin-top: 12px;
  }

  .btn-cancel {
    max-width: 114px;
  }
}
</style>
