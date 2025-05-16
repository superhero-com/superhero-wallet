<template>
  <div class="transfer-send-recipient">
    <FormAccountInput
      :v-model="modelValue"
      :model-value="modelValue"
      name="addresses"
      data-cy="address"
      show-help
      show-message-help
      is-recipient
      :single-default-format="maxRecipients === 1"
      :is-tip-url-enabled="isUrlTippingEnabled"
      :protocol="protocol"
      :label="$t('modals.send.recipientLabel')"
      :placeholder="placeholder"
      :message="addressMessage"
      @update:modelValue="$emit('update:modelValue', $event)"
      @help="showRecipientHelp()"
      @blur="handleBlur($event, true)"
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
    </FormAccountInput>

    <div v-if="isTipUrl" class="status">
      <UrlStatus :status="urlStatus" />
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  watch,
} from 'vue';
import { useField } from 'vee-validate';

import type { Protocol, IInputMessage } from '@/types';
import { getMessageByFieldName } from '@/utils';
import {
  MODAL_ADDRESS_BOOK_ACCOUNT_SELECTOR,
  MODAL_RECIPIENT_INFO,
  PROTOCOLS,
} from '@/constants';
import { useAccounts, useModals } from '@/composables';
import { useAeTippingUrls } from '@/protocols/aeternity/composables';

import UrlStatus from '@/popup/components/UrlStatus.vue';
import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';

import QrScanIcon from '@/icons/qr-scan.svg?vue-component';
import AddressBookIcon from '@/icons/menu-card-fill.svg?vue-component';
import FormAccountInput from '@/popup/components/form/FormAccountInput.vue';

export default defineComponent({
  components: {
    FormAccountInput,
    UrlStatus,
    BtnIcon,
  },
  props: {
    isUrlTippingEnabled: Boolean,
    isTipUrl: Boolean,
    maxRecipients: { type: Number, default: null },
    modelValue: { type: Array as PropType<string[]>, default: () => [] },
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
    const { value: fieldValue, handleBlur } = useField('addresses', {
      required: true,
      // TODO: currently it only shows the first warning/error, so give priority to error
      ...(props.maxRecipients ? { max_recipients: props.maxRecipients } : {}),
      ...props.validationRules,
      address_not_same_as: [activeAccount.value.address, props.protocol],
    }, {
      bails: false, // TODO: validate all rules and show them all instead of the first
    });

    const { getTippingUrlStatus } = useAeTippingUrls({ ensureFetchedOnInit: isAe.value });

    const urlStatus = computed(() => getTippingUrlStatus(props.modelValue?.[0]));

    const addressMessage = computed((): IInputMessage => {
      const messagesByFieldName = getMessageByFieldName(props.errors.addresses);
      if (messagesByFieldName.status === 'error') {
        return messagesByFieldName;
      }
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
      return messagesByFieldName;
    });

    function showRecipientHelp() {
      openModal(MODAL_RECIPIENT_INFO, { protocol: props.protocol });
    }

    async function selectFromAddressBook() {
      const addresses = await openModal<string[]>(
        MODAL_ADDRESS_BOOK_ACCOUNT_SELECTOR,
        {
          preSelectedAddresses: props.modelValue,
          allowMultiple: props.maxRecipients > 1,
        },
      );
      if (addresses) {
        // This includes all addresses, even if the user has typed them,
        // since we are passing the preSelectedAddresses as a prop
        emit('update:modelValue', [...addresses]);
      }
    }

    watch(
      () => props.modelValue,
      (val) => {
        fieldValue.value = val;
      }, // validate on mount
      { immediate: !!props.modelValue.length },
    );

    return {
      QrScanIcon,
      AddressBookIcon,
      urlStatus,
      activeAccount,
      addressMessage,
      handleBlur,
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
