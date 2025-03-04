<template>
  <Modal
    class="address-book-account-selector"
    has-close-button
    full-screen
    from-bottom
    @close="cancel()"
  >
    <IonPage>
      <h2
        class="header"
        v-text="(
          isSigner ? $t('pages.addressBook.selectSignerAddress') : $t('pages.addressBook.selectRecipientAddress')
        )"
      />
      <div
        v-if="allowMultiple"
        class="tabs-container"
      >
        <Tabs class="tabs">
          <Tab
            v-for="({ name, text }) in dataTabs"
            :key="name"
            :data-cy="name"
            :text="text"
            :active="activeTab === name"
            @click="setActiveTab(name)"
          />
        </Tabs>
      </div>
      <AddressBookList
        is-selector
        :selected-addresses="selectedAddresses"
        :is-multiple="activeTab === dataTabs[1].name"
        @select-address="handleSelectAddresses"
      />
    </IonPage>
    <template v-if="activeTab === dataTabs[1].name" #footer>
      <BtnMain
        variant="muted"
        class="button-action-secondary"
        data-cy="cancel"
        :text="$t('common.cancel')"
        @click="cancel()"
      />
      <BtnMain
        class="button-action-primary"
        data-cy="submit"
        :text="`${$t('pages.addressBook.useSelected')} (${selectedAddresses.length})`"
        :disabled="!selectedAddresses.length"
        @click="submit()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeMount,
  PropType,
  ref,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { IonPage } from '@ionic/vue';

import type { ResolveCallback, RejectCallback, Protocol } from '@/types';
import { useAccounts, useAddressBook } from '@/composables';

import Modal from '@/popup/components/Modal.vue';
import AddressBookList from '@/popup/components/AddressBook/AddressBookList.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import Tabs from '@/popup/components/tabs/Tabs.vue';
import Tab from '@/popup/components/tabs/Tab.vue';

export default defineComponent({
  components: {
    IonPage,
    Modal,
    AddressBookList,
    BtnMain,
    Tabs,
    Tab,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    protocol: { type: String as PropType<Protocol>, default: null },
    isSigner: Boolean,
    allowMultiple: Boolean,
    preSelectedAddresses: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  setup(props) {
    const { t } = useI18n();
    const { activeAccount } = useAccounts();
    const { setProtocolFilter } = useAddressBook();

    const preSelectedAddresses = [...props.preSelectedAddresses];
    const selectedAddresses = ref<string[]>(props.preSelectedAddresses);

    const dataTabs = [
      {
        name: 'single',
        text: t('pages.addressBook.singleRecipient'),
      },
      {
        name: 'multiple',
        text: t('pages.addressBook.multipleRecipients'),
      },
    ];
    const activeTab = ref(dataTabs[props.preSelectedAddresses?.length > 1 ? 1 : 0].name);

    function handleSelectAddresses(address: string) {
      if (activeTab.value === dataTabs[0].name) {
        props.resolve([address]);
        return;
      }
      const index = selectedAddresses.value.indexOf(address);

      if (index !== -1) {
        // Remove it if it's already selected
        selectedAddresses.value.splice(index, 1);
      } else {
        selectedAddresses.value.push(address);
      }
    }

    function setActiveTab(tabName: string) {
      activeTab.value = tabName;
    }

    function submit() {
      props.resolve(selectedAddresses.value);
    }

    function cancel() {
      props.resolve(preSelectedAddresses);
    }

    onBeforeMount(() => {
      setProtocolFilter(props.protocol ?? activeAccount.value?.protocol);
    });

    return {
      dataTabs,
      activeTab,
      selectedAddresses,
      setActiveTab,
      handleSelectAddresses,
      submit,
      cancel,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.address-book-account-selector {
  .header {
    @extend %face-sans-15-medium;

    padding: 8px 16px;
    color: rgba($color-white, 0.75);
  }

  .tabs-container {
    padding: 0px 8px;
  }
}
</style>
