<template>
  <div class="transfer-send-recipient">
    <Field
      v-slot="{ field }"
      name="address"
      :model-value="modelValue"
      :validate-on-mount="!!modelValue"
      :rules="{
        required: true,
        address_not_same_as: [activeAccount.address, protocol],
        ...validationRules,
      }"
    >
      <FormTextarea
        v-bind="field"
        :model-value="modelValue"
        name="address"
        data-cy="address"
        auto-height
        show-help
        show-message-help
        :label="$t('modals.send.recipientLabel')"
        :placeholder="placeholder"
        :message="addressMessage"
        @update:modelValue="$emit('update:modelValue', $event)"
        @help="showRecipientHelp()"
      >
        <template #label-after>
          <div class="buttons">
            <BtnIcon
              :icon="AddressBookIcon"
              data-cy="address-book-button"
              @click="selectFromAddressBook()"
            />
            <BtnIcon
              :icon="QrScanIcon"
              data-cy="scan-button"
              @click="$emit('openQrModal')"
            />
          </div>
        </template>
      </FormTextarea>
    </Field>
    <div
      v-if="isTipUrl"
      class="status"
    >
      <UrlStatus :status="urlStatus" />
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import { Field } from 'vee-validate';

import type { Protocol, IInputMessage } from '@/types';
import { getMessageByFieldName } from '@/utils';
import { MODAL_ADDRESS_BOOK_ACCOUNT_SELECTOR, MODAL_RECIPIENT_INFO, PROTOCOLS } from '@/constants';
import {
  useAccounts,
  useModals,
} from '@/composables';
import { useAeTippingUrls } from '@/protocols/aeternity/composables';

import UrlStatus from '@/popup/components/UrlStatus.vue';
import FormTextarea from '@/popup/components/form/FormTextarea.vue';
import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';

import QrScanIcon from '@/icons/qr-scan.svg?vue-component';
import AddressBookIcon from '@/icons/menu-card-fill.svg?vue-component';

export default defineComponent({
  components: {
    FormTextarea,
    UrlStatus,
    Field,
    BtnIcon,
  },
  props: {
    isTipUrl: Boolean,
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    protocol: { type: String as PropType<Protocol>, required: true },
    validationRules: { type: Object, default: () => ({}) },
    errors: { type: Object, required: true },
  },
  emits: ['openQrModal', 'update:modelValue'],
  setup(props, { emit }) {
    const isAe = computed(() => props.protocol === PROTOCOLS.aeternity);

    const { openModal } = useModals();
    const { activeAccount } = useAccounts();
    const { getTippingUrlStatus } = useAeTippingUrls({ ensureFetchedOnInit: isAe.value });

    const urlStatus = computed(() => getTippingUrlStatus(props.modelValue));

    const addressMessage = computed((): IInputMessage => {
      if (props.isTipUrl) {
        switch (urlStatus.value) {
          case 'verified':
            return { status: 'success', text: '', hideMessage: true };
          case 'not-secure':
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
      openModal(MODAL_RECIPIENT_INFO, { protocol: props.protocol });
    }

    async function selectFromAddressBook() {
      const address = await openModal<string>(MODAL_ADDRESS_BOOK_ACCOUNT_SELECTOR);
      if (address) {
        emit('update:modelValue', address);
      }
    }

    return {
      QrScanIcon,
      AddressBookIcon,
      urlStatus,
      activeAccount,
      addressMessage,
      showRecipientHelp,
      selectFromAddressBook,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.transfer-send-recipient {
  .status {
    margin-top: 9px;
  }

  .buttons {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
  }
}
</style>
