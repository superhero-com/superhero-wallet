<template>
  <Modal
    from-bottom
    has-close-button
    class="ledger-import-accounts"
    @close="reject()"
  >
    <div class="top-icon-wrapper">
      <IconBoxed
        icon-padded
        bg-colored
        outline-colored
        :class="{ connected: ledgerConnected }"
      >
        <LedgerIcon class="icon" />
      </IconBoxed>
    </div>

    <h2
      class="text-heading-4 text-center title"
      v-text="ledgerConnected ? $t('ledger.importAccounts.connected') : $t('ledger.importAccounts.title')"
    />

    <span
      class="subtitle"
      v-text="ledgerConnected
        ? $t('ledger.importAccounts.subtitleConnected')
        : $t('ledger.importAccounts.subtitle')"
    />

    <div
      v-if="!ledgerConnected"
      class="usb-guide"
    >
      <div class="step">
        <div
          class="step-number"
          v-text="1"
        />
        <span v-text="$t('ledger.importAccounts.usbGuide1')" />
      </div>
      <div class="step">
        <div
          class="step-number"
          v-text="2"
        />
        <span v-text="$t('ledger.importAccounts.usbGuide2')" />
      </div>
      <div class="step">
        <div
          class="step-number"
          v-text="3"
        />
        <span v-text="$t('ledger.importAccounts.usbGuide3')" />
      </div>
    </div>

    <Tabs
      v-if="ledgerConnected"
      class="tabs"
    >
      <Tab
        v-for="({ name, text }) in dataTabs"
        :key="name"
        :data-cy="name"
        :text="text"
        :active="activeTab === name"
        @click="setActiveTab(name)"
      />
    </Tabs>

    <template v-if="activeTab === dataTabs[0].name && ledgerConnected">
      <span
        class="tab-subtitle"
        v-text="normalizedLedgerAccounts.length
          ? $t('ledger.importAccounts.discoverAccountsTitle')
          : $t('ledger.importAccounts.nothingDiscovered')"
      />

      <div
        v-if="normalizedLedgerAccounts.length"
        class="select-account-row select-all"
      >
        <CheckBox
          :model-value="areAllAccountsSelected"
          @change="selectAll"
        >
          <span v-text="$t('ledger.importAccounts.selectAll')" />
        </CheckBox>
      </div>
      <BtnMain
        v-else
        :text="$t('ledger.importAccounts.createNewAccount')"
        class="create-new-account"
        @click="setActiveTab(dataTabs[1].name)"
      />
      <div
        v-for="(option, index) in normalizedLedgerAccounts"
        :key="option.address"
        class="select-account-row"
        :class="{ 'already-imported': walletAccountAddresses.includes(option.address) }"
      >
        <CheckBox
          v-model="chosenAccounts[index]"
          :disabled="walletAccountAddresses.includes(option.address)"
        />
        <AccountImportRow
          :account="option"
          :selected="chosenAccounts[index]"
          class="account-select-options-item"
          :disabled="walletAccountAddresses.includes(option.address)"
          @click="chosenAccounts[index] = !chosenAccounts[index]"
        />
      </div>
    </template>
    <template v-else-if="activeTab === dataTabs[1].name">
      <span
        class="tab-subtitle"
        v-text="$t('ledger.importAccounts.deriveAccountTitle')"
      />
      <InputField
        v-model="accountIndex"
        :label="$t('ledger.importAccounts.deriveAccount')"
        type="number"
        integer
        class="input-derivation-index"
        @update:modelValue="debounceHandleInput"
      />
      <AccountSkeleton
        v-if="deriving"
        show-balance
      />
      <AccountImportRow
        v-else-if="derivedAccount"
        :account="derivedAccount"
        class="account-select-options-item"
        :class="{ 'already-imported': walletAccountAddresses.includes(derivedAccount.address) }"
      />
    </template>

    <div
      v-if="loading"
      class="loading"
    >
      <AnimatedSpinnerIcon class="icon" />
      <span v-text="$t('ledger.importAccounts.sendingRequest')" />
    </div>

    <span
      v-if="error"
      class="error"
      v-text="$t('ledger.importAccounts.connectionError')"
    />

    <template #footer>
      <BtnMain
        v-if="ledgerConnected"
        variant="muted"
        extra-padded
        :text="$t('common.cancel')"
        @click="reject"
      />
      <BtnMain
        v-if="!ledgerConnected"
        :text="loading ? $t('common.connecting') : $t('common.connect')"
        :icon="UsbIcon"
        :disabled="loading"
        @click="discoverLedgerAccounts"
      />
      <BtnMain
        v-if="ledgerConnected && activeTab === dataTabs[0].name"
        data-cy="import"
        :text="$t('ledger.importAccounts.importAccounts')"
        @click="importAccounts"
      />
      <BtnMain
        v-if="ledgerConnected && activeTab === dataTabs[1].name"
        data-cy="create"
        :text="$t('ledger.importAccounts.createAccount')"
        :disabled="walletAccountAddresses.includes(derivedAccount.address)"
        @click="createAccount"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  onMounted,
  PropType,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { AccountLedger } from '@aeternity/aepp-sdk';
import { debounce } from 'lodash-es';

import { ACCOUNT_TYPES, PROTOCOLS } from '@/constants';
import { useLedger, useAccounts } from '@/composables';
import type { IAccountRaw, RejectCallback, ResolveCallback } from '@/types';

import AccountImportRow from '@/popup/components/AccountImportRow.vue';
import AccountSkeleton from '@/popup/components/AccountSkeleton.vue';

import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import CheckBox from '@/popup/components/CheckBox.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';
import InputField from '@/popup/components/InputField.vue';
import Modal from '@/popup/components/Modal.vue';
import Tab from '@/popup/components/tabs/Tab.vue';
import Tabs from '@/popup/components/tabs/Tabs.vue';

import AnimatedSpinnerIcon from '@/icons/animated-spinner.svg?vue-component';
import LedgerIcon from '@/icons/ledger.svg?vue-component';
import UsbIcon from '@/icons/usb.svg?vue-component';

export default defineComponent({
  components: {
    AccountImportRow,
    AccountSkeleton,
    BtnMain,
    CheckBox,
    IconBoxed,
    InputField,
    Modal,
    Tab,
    Tabs,
    AnimatedSpinnerIcon,
    LedgerIcon,
  },
  props: {
    resolve: {
      type: Function as PropType<ResolveCallback<IAccountRaw[]>>,
      required: true,
    },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup(props) {
    const { t } = useI18n();
    const { deriveAccount, discoverAccounts } = useLedger();
    const { accounts } = useAccounts();

    const dataTabs = [
      {
        name: 'import',
        text: t('ledger.importAccounts.importAccounts'),
      },
      {
        name: 'create',
        text: t('ledger.importAccounts.createAccount'),
      },
    ];

    const walletAccountAddresses = ref<string []>([]);
    const accountIndex = ref<number>(0);
    const activeTab = ref(dataTabs[0].name);
    const chosenAccounts = ref<boolean[]>([]);
    const deriving = ref(false);
    const derivedAccount = ref<IAccountRaw>();
    const error = ref(false);
    const ledgerConnected = ref(false);
    const loading = ref(false);
    const normalizedLedgerAccounts = ref<IAccountRaw[]>([]);

    const areAllAccountsSelected = computed(() => chosenAccounts.value.every((a) => a));

    function selectAll() {
      chosenAccounts.value = normalizedLedgerAccounts.value
        .map(({ address }) => (
          walletAccountAddresses.value.includes(address!)
          || !areAllAccountsSelected.value
        ));
    }

    function normalizeAccount(account: AccountLedger): IAccountRaw {
      return {
        idx: account.index,
        address: account.address,
        type: ACCOUNT_TYPES.ledger,
        publicKey: account.address,
        protocol: PROTOCOLS.aeternity,
        isRestored: false,
      };
    }

    async function deriveLedgerAccount() {
      if (accountIndex.value > 0 && !deriving.value) {
        try {
          error.value = false;
          deriving.value = true;
          // Account index is started from 1,
          // but derivation path for this account is actually having index 0
          derivedAccount.value = normalizeAccount(await deriveAccount(accountIndex.value - 1));
        } catch (e) {
          error.value = true;
        } finally {
          deriving.value = false;
        }
      }
    }

    async function discoverLedgerAccounts() {
      try {
        error.value = false;
        loading.value = true;
        const ledgerAccounts = await discoverAccounts();

        normalizedLedgerAccounts.value = ledgerAccounts.map(normalizeAccount);
        accountIndex.value = normalizedLedgerAccounts.value.length + 1;
        deriveLedgerAccount();
        chosenAccounts.value = normalizedLedgerAccounts.value
          .map(({ address }) => walletAccountAddresses.value.includes(address!));
        ledgerConnected.value = true;
      } catch (e) {
        error.value = true;
      } finally {
        loading.value = false;
      }
    }

    const debounceHandleInput = debounce(deriveLedgerAccount, 500, { leading: true });

    function setActiveTab(tabName: string) {
      activeTab.value = tabName;
    }

    function importAccounts() {
      props.resolve(normalizedLedgerAccounts.value
        .filter((_, index) => chosenAccounts.value[index]));
    }

    function createAccount() {
      props.resolve(derivedAccount.value ? [derivedAccount.value] : []);
    }

    onMounted(() => {
      walletAccountAddresses.value = accounts.value
        .filter(({ protocol }) => protocol === PROTOCOLS.aeternity)
        .map(({ address }) => address);
    });

    return {
      accountIndex,
      activeTab,
      areAllAccountsSelected,
      chosenAccounts,
      dataTabs,
      derivedAccount,
      deriving,
      error,
      ledgerConnected,
      loading,
      normalizedLedgerAccounts,
      UsbIcon,
      debounceHandleInput,
      walletAccountAddresses,
      createAccount,
      discoverLedgerAccounts,
      importAccounts,
      selectAll,
      setActiveTab,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.ledger-import-accounts {
  .top-icon-wrapper {
    margin-bottom: 20px;
    text-align: center;
    color: $color-grey-medium;

    .icon {
      color: rgba($color-white, 0.75);
    }

    .connected {
      color: $color-success-dark;

      .icon {
        color: $color-success-dark;
      }
    }
  }

  .subtitle {
    @extend %face-sans-16-medium;

    line-height: 24px;
    text-align: center;
  }

  .create-new-account {
    width: 100%;
    margin-top: 24px;
  }

  .select-account-row {
    display: flex;
    margin-top: 8px;

    &.select-all {
      margin: 24px 0 8px 0;
    }

    .account-select-options-item {
      max-width: 282px;
    }
  }

  .already-imported {
    opacity: 0.4;
  }

  .usb-guide {
    display: flex;
    flex-direction: column;
    margin-top: 16px;
    gap: 8px;

    .step {
      display: flex;
      gap: 16px;

      .step-number {
        font-weight: 700;
        line-height: 24px;
        border: 2px solid rgba($color-white, 0.15);
        border-radius: 28px;
        text-align: center;
        width: 28px;
        height: 28px;
        color: $color-white;
      }
    }
  }

  .tabs {
    margin-block: 8px;
  }

  .tab-subtitle {
    @extend %face-sans-15-regular;

    text-align: center;
  }

  .input-derivation-index {
    width: 117px;
    margin-bottom: 16px;
  }

  .loading {
    width: 160px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;

    .icon {
      width: 56px;
      height: 56px;
    }
  }

  .error {
    color: $color-danger;
    padding-block: 8px;
    text-align: center;
  }
}
</style>
