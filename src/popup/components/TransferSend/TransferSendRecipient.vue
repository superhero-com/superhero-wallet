<template>
  <div class="transfer-send-recipient">
    <Field
      v-slot="{ field }"
      name="address"
      :rules="{
        required: true,
        not_same_as: [activeAccount.address, protocol],
        ...validationRules,
      }"
    >
      <InputField
        v-bind="field"
        :model-value="modelValue"
        name="address"
        data-cy="address"
        show-help
        show-message-help
        :label="$t('modals.send.recipientLabel')"
        :placeholder="placeholder"
        :message="addressMessage"
        @update:modelValue="$emit('update:modelValue', $event)"
        @help="showRecipientHelp()"
      >
        <template #label-after>
          <a
            class="scan-button"
            data-cy="scan-button"
            @click="$emit('openQrModal')"
          >
            <QrScanIcon />
          </a>
        </template>
      </InputField>
    </Field>
    <div class="status">
      <UrlStatus
        v-show="isTipUrl"
        :status="urlStatus"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import { useStore } from 'vuex';
import { Field } from 'vee-validate';

import { getMessageByFieldName } from '@/utils';

import {
  useAccounts,
  useModals,
} from '@/composables';
import type { Protocol, IInputMessage } from '@/types';
import UrlStatus from '@/popup/components/UrlStatus.vue';
import InputField from '@/popup/components/InputField.vue';
import QrScanIcon from '@/icons/qr-scan.svg?vue-component';
import { MODAL_RECIPIENT_INFO } from '@/constants';

export default defineComponent({
  components: {
    InputField,
    UrlStatus,
    Field,
    QrScanIcon,
  },
  props: {
    isTipUrl: Boolean,
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    protocol: { type: String as PropType<Protocol>, required: true },
    validationRules: {
      type: Object,
      default: () => {
      },
    },
    errors: { type: Object, required: true },
  },
  emits: ['openQrModal'],
  setup(props) {
    const store = useStore();

    const { openModal } = useModals();
    const { activeAccount } = useAccounts({ store });

    const urlStatus = computed(
      () => store.getters['tipUrl/status'](props.modelValue),
    );

    const addressMessage = computed((): IInputMessage => {
      if (props.isTipUrl) {
        switch (urlStatus.value) {
          case 'verified':
            return { status: 'success', text: '', hideMessage: true };
          case 'not-secure':
            return { status: 'warning', text: '', hideMessage: true };
          case 'not-verified':
            return { status: 'warning', text: '', hideMessage: true };
          case 'blacklisted':
            return { status: 'error', text: '', hideMessage: true };
          default:
            throw new Error(`Unknown url status: ${urlStatus.value}`);
        }
      }
      return getMessageByFieldName(props.errors.address);
    });

    function showRecipientHelp() {
      openModal(MODAL_RECIPIENT_INFO);
    }

    return {
      urlStatus,
      activeAccount,
      addressMessage,
      showRecipientHelp,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.transfer-send-recipient {
  .scan-button {
    color: $color-white;
    display: block;
    width: 32px;
    height: 24px;
  }

  .status {
    margin-top: 9px;
  }
}
</style>
