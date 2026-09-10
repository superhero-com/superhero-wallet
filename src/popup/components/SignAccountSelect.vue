<template>
  <div class="sign-account-select">
    <p
      v-if="label"
      class="sign-account-select-label text-description"
      v-text="label"
    />

    <FormSelect
      :model-value="account?.address"
      :default-text="$t('modals.signAccountSelect.selectAccount')"
      :options="options"
      class="account-select-input"
      item-title="value"
      account-select
      unstyled
      hide-arrow
      data-cy="sign-account-select"
      @select="onSelectAccount($event)"
    >
      <template #current-text>
        <AccountSelectOptionsItem
          v-if="account"
          :custom-account="account"
          hide-balance
        >
          <template #after-address>
            <ChevronDown class="chevron" />
          </template>
        </AccountSelectOptionsItem>
      </template>
    </FormSelect>

    <!-- Only worth saying something when the selection cannot sign the transaction. -->
    <p
      v-if="showHint"
      class="sign-account-select-hint text-description warning"
      data-cy="sign-account-original-hint"
    >
      <InfoIcon class="icon" />
      <i18n-t
        :keypath="signerAccountMissing
          ? 'modals.signAccountSelect.preparedForMissingAccount'
          : 'modals.signAccountSelect.preparedForOtherAccount'"
        tag="span"
        scope="global"
      >
        <strong v-text="originalAccountName" />
      </i18n-t>
    </p>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import type { IAccount, Protocol } from '@/types';
import { useAccounts } from '@/composables';
import { truncateAddress } from '@/utils';

import AccountSelectOptionsItem from './AccountSelectOptionsItem.vue';
import FormSelect from './form/FormSelect.vue';

import ChevronDown from '../../icons/chevron-down.svg?vue-component';
import InfoIcon from '../../icons/warning-outline.svg?vue-component';

export default defineComponent({
  name: 'SignAccountSelect',
  components: {
    AccountSelectOptionsItem,
    FormSelect,
    ChevronDown,
    InfoIcon,
  },
  props: {
    /** Currently selected account (controlled by the parent). */
    account: { type: Object as PropType<IAccount>, default: undefined },
    /** Protocol whose accounts can be picked from. */
    protocol: { type: String as PropType<Protocol>, required: true },
    /** Optional caption rendered above the selector. */
    label: { type: String, default: undefined },
    /**
     * Address the action was prepared for (e.g. the sender baked into a
     * pre-built transaction). Only that account can produce a signature the node
     * will accept, so the user is told which one it is - and warned when the
     * current selection is not it.
     */
    originalAddress: { type: String, default: undefined },
    /** The `originalAddress` account is not held by this wallet. */
    signerAccountMissing: Boolean,
  },
  emits: {
    // eslint-disable-next-line no-unused-vars
    select: (account: IAccount) => !!account,
  },
  setup(props, { emit }) {
    const { getAccountsSelectOptionsByProtocol, getAccountByProtocolAndAddress } = useAccounts();

    const options = computed(() => getAccountsSelectOptionsByProtocol(props.protocol));

    const originalAccountName = computed(() => (
      props.originalAddress ? truncateAddress(props.originalAddress).join('…') : ''
    ));

    const matchesOriginal = computed(() => (
      !props.signerAccountMissing && props.account?.address === props.originalAddress
    ));

    /**
     * Say nothing while the selected account is the one the transaction was
     * prepared for - that is the expected case and needs no commentary.
     */
    const showHint = computed(() => !!props.originalAddress && !matchesOriginal.value);

    function onSelectAccount(addressWithProtocol: string) {
      const [protocol, address] = String(addressWithProtocol).split(':');
      const account = getAccountByProtocolAndAddress(protocol as Protocol, address);
      if (account) {
        emit('select', account);
      }
    }

    return {
      options,
      originalAccountName,
      showHint,
      onSelectAccount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.sign-account-select {
  .sign-account-select-label {
    margin-bottom: 4px;
    text-align: left;
  }

  .account-select-input {
    width: 100%;
  }

  .chevron {
    width: 10px;
    height: 10px;
    align-self: center;
    opacity: 0.7;
    margin-left: 1px;
    padding-top: 4px;
  }

  .sign-account-select-hint {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    text-align: left;
    color: $color-warning;

    .icon {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
    }

    strong {
      color: $color-white;
      font-weight: 500;
    }
  }
}
</style>
