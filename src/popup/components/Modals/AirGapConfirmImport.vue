<template>
  <Modal
    full-screen
    has-close-button
    dense
    class="air-gap-confirm-import"
    @close="cancel()"
  >
    <template #header>
      <div class="title">
        {{ $t('modals.importAirGapAccount.importConfirmDialog.title') }}
      </div>
    </template>
    <div>
      <div
        v-if="filteredAccounts.length"
        class="select-all"
      >
        <CheckBox v-model="selectAll" />
        {{ $t('modals.importAirGapAccount.importConfirmDialog.selectAll') }}
      </div>
      <div
        v-else
        class="message"
      >
        {{ $t('modals.importAirGapAccount.importConfirmDialog.noAccountsFound') }}
      </div>
      <div
        v-for="account in filteredAccounts"
        :key="account.address"
        class="account-row"
        :class="{disabled: isAccountAlreadyImported(account)}"
      >
        <CheckBox
          v-model="selectedAccounts[account.address]"
          :disabled="isAccountAlreadyImported(account)"
        />
        <AccountImportRow :account="account" />
      </div>
    </div>
    <template #footer>
      <BtnMain
        variant="muted"
        :text="$t('modals.cancel')"
        @click="cancel()"
      />
      <BtnMain
        extra-padded
        :text="$t('modals.importAirGapAccount.importConfirmDialog.importAccounts')"
        :disabled="!hasSelectedAccounts"
        @click="confirm()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  watch,
  computed,
  PropType,
} from '@vue/composition-api';
import type { IAccount } from '../../../types';
import { useState } from '../../../composables/vuex';

import Modal from '../Modal.vue';
import CheckBox from '../CheckBox.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AccountImportRow from '../AccountImportRow.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    AccountImportRow,
    CheckBox,
  },
  props: {
    resolve: {
      // eslint-disable-next-line no-unused-vars
      type: Function as PropType<(selectedAccounts: IAccount[]) => void>,
      required: true,
    },
    reject: { type: Function as PropType<() => void>, required: true },
    accounts: { type: Array as PropType<IAccount[]>, required: true },
  },
  setup(props) {
    const importedAccounts = useState<IAccount[]>('accounts', 'list');
    const searchPhrase = ref<string>('');
    const selectAll = ref<boolean>(false);
    const selectedAccounts = ref<Record<string, boolean>>({});
    const hasSelectedAccounts = computed((): boolean => props.accounts.some(
      (account) => selectedAccounts.value[account.address],
    ));
    const filteredAccounts = computed((): IAccount[] => (
      props.accounts.filter((account) => account.address.includes(searchPhrase.value))
    ));

    function isAccountAlreadyImported(account: IAccount) {
      return importedAccounts.value.some((acc) => acc.address === account.address);
    }

    function confirm() {
      props.resolve(props.accounts.filter(
        (account) => selectedAccounts.value[account.address],
      ));
    }

    function cancel() {
      props.reject();
    }

    watch(
      selectAll,
      (_selectAll) => {
        const _selectedAccounts: Record<string, boolean> = {
          ...selectedAccounts.value,
        };
        props.accounts.forEach((account: IAccount) => {
          _selectedAccounts[account.address] = _selectAll;
        });
        selectedAccounts.value = _selectedAccounts;
      },
    );

    return {
      confirm,
      cancel,
      searchPhrase,
      selectAll,
      selectedAccounts,
      filteredAccounts,
      hasSelectedAccounts,
      isAccountAlreadyImported,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.air-gap-confirm-import {
  .title {
    @extend %face-sans-15-medium;

    color: rgba(variables.$color-white, 0.75);
    text-align: left;
    padding: 12px;
  }

  .select-all,
  .account-row {
    @include mixins.flex(flex-start, center, row);

    padding-bottom: 8px;

    .account-import-row {
      flex: 1;
    }

    &.disabled {
      opacity: 0.5;
    }
  }

  .message {
    @extend %face-sans-15-medium;

    color: variables.$color-grey-light;
    text-align: center;
    padding: 48px 64px 0;
  }
}
</style>
