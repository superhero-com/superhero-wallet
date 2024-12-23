<template>
  <div class="address-book-list">
    <IonHeader class="address-book-header">
      <Transition name="fade-between">
        <InputSearch
          v-if="isSearchVisible"
          v-model="searchQuery"
          :placeholder="$t('pages.addressBook.searchPlaceholder', [`${protocolName} `])"
          class="search-field"
        />
      </Transition>

      <AddressBookFilters
        v-if="!isSelector || !searchQuery"
        :is-selector="isSelector"
        :has-bookmarked-entries="hasBookmarkedEntries"
      />
    </IonHeader>

    <IonContent
      ref="scrollWrapperEl"
      class="ion-padding"
      :class="{ 'ion-content-bg': !isSelector }"
    >
      <div
        v-if="Object.keys(accountsFiltered).length"
        class="list"
      >
        <PanelItem
          v-for="({
            address,
            name,
            protocol,
            isOwnAddress,
            nameAddress,
            type,
          }, index) in accountsFiltered"
          :key="address"
          :to="
            (isSelector)
              ? undefined
              : { name: ROUTE_ADDRESS_BOOK_EDIT, params: { id: address } }
          "
          class="address-book-item"
          :style="bgColorStyle(isOwnAddress, nameAddress, address)"
          :idx="index"
          data-cy="address-book-item"
          @click="selectAddress(nameAddress, address)"
        >
          <AccountInfo
            :account="{ address, protocol }"
            :custom-name="name"
            :name-address="nameAddress"
            show-protocol-icon
          />
          <template v-if="accountIcon(type) && isSelector" #bottom-right-icon>
            <Component
              :is="accountIcon(type)"
              class="account-type-icon"
            />
          </template>
        </PanelItem>
      </div>
      <p
        v-else
        class="message"
        v-text="noRecordsMessage"
      />
    </IonContent>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  watch,
} from 'vue';
import { throttle } from 'lodash-es';
import { IonContent, IonHeader } from '@ionic/vue';
import { Encoded } from '@aeternity/aepp-sdk';
import { useRoute } from 'vue-router';

import type { AccountType, ComponentRef } from '@/types';
import { ACCOUNT_SELECT_TYPE_FILTER, ACCOUNT_TYPES } from '@/constants';
import { ROUTE_ADDRESS_BOOK, ROUTE_ADDRESS_BOOK_EDIT } from '@/popup/router/routeNames';
import { getAddressColor } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useAccountSelector } from '@/composables';

import { useAeNames } from '@/protocols/aeternity/composables/aeNames';

import { tg } from '@/popup/plugins/i18n';
import InputSearch from '@/popup/components/InputSearch.vue';
import AccountInfo from '@/popup/components/AccountInfo.vue';
import AddressBookFilters from '@/popup/components/AddressBook/AddressBookFilters.vue';
import PanelItem from '@/popup/components/PanelItem.vue';
import BtnBase from '@/popup/components/buttons/BtnBase.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import IconWrapper from '@/popup/components/IconWrapper.vue';

import AirGapIcon from '@/icons/air-gap.svg?vue-component';
import PrivateKeyIcon from '@/icons/private-key.svg?vue-component';

export default defineComponent({
  components: {
    IconWrapper,
    BtnMain,
    BtnBase,
    IonHeader,
    IonContent,
    AccountInfo,
    AddressBookFilters,
    InputSearch,
    PanelItem,
  },
  props: {
    modelValue: Boolean,
    /** Whether the list is being used in an account selector or not  */
    isSelector: Boolean,
  },
  emits: ['update:hideButtons', 'select-address'],
  setup(props, { emit }) {
    const { getNameByNameHash } = useAeNames();

    const scrollWrapperEl = ref<ComponentRef>();
    const isScrolled = ref(false);

    const {
      accountSelectType,
      accountsFiltered,
      addressBookFilteredByProtocol,
      protocolFilter,
      searchQuery,
      showBookmarked,
      setAccountSelectType,
    } = useAccountSelector();
    const route = useRoute();

    const noRecordsMessage = computed(() => {
      switch (true) {
        case !!searchQuery.value:
          return tg('pages.addressBook.noRecords.search');
        case protocolFilter.value === null:
          return tg('pages.addressBook.noRecords.addressBook');
        case showBookmarked.value:
          return tg('pages.addressBook.noRecords.bookmarked');
        case accountSelectType.value === ACCOUNT_SELECT_TYPE_FILTER.recent:
          return tg('pages.addressBook.noRecords.recent');
        default:
          return tg('pages.addressBook.noRecords.blockchain');
      }
    });
    const scrollWrapper = computed(() => scrollWrapperEl.value?.$el);
    const protocolName = computed(() => (protocolFilter.value)
      ? ProtocolAdapterFactory.getAdapter(protocolFilter.value)?.protocolName
      : '');
    const hideOuterButtons = computed(() => isScrolled.value || !!searchQuery.value);
    const isSearchVisible = computed(() => (
      (
        (!protocolFilter.value || showBookmarked.value)
        && Object.keys(addressBookFilteredByProtocol.value).length > 9
      ) || props.isSelector
    ) || hideOuterButtons.value);
    const hasBookmarkedEntries = computed(
      () => addressBookFilteredByProtocol.value.some((entry) => entry.isBookmarked),
    );

    const handleScroll = throttle(() => {
      if (!scrollWrapper.value) return;
      isScrolled.value = scrollWrapper.value?.scrollTop > 0;
      emit('update:hideButtons', hideOuterButtons.value);
    }, 100);

    function accountIcon(type: AccountType) {
      switch (type) {
        case ACCOUNT_TYPES.airGap:
          return AirGapIcon;
        case ACCOUNT_TYPES.privateKey:
          return PrivateKeyIcon;
        default:
          return null;
      }
    }

    function bgColorStyle(isOwnAddress: boolean, nameAddress: String, address: String) {
      return isOwnAddress ? { '--bg-color': getAddressColor(address) } : {};
    }

    async function selectAddress(nameAddress: Encoded.Name, address: String) {
      if (nameAddress) {
        emit('select-address', await getNameByNameHash(nameAddress));
      } else {
        emit('select-address', address);
      }
    }

    onMounted(() => {
      searchQuery.value = '';
      scrollWrapper.value?.addEventListener('scroll', handleScroll);
      setAccountSelectType(
        (hasBookmarkedEntries.value)
          ? ACCOUNT_SELECT_TYPE_FILTER.bookmarked
          : ACCOUNT_SELECT_TYPE_FILTER.addressBook,
      );
    });

    // onBeforeUnmount will not be called when user navigates to add/edit page
    watch(route, ({ name }) => {
      if (name === ROUTE_ADDRESS_BOOK) {
        scrollWrapper.value?.addEventListener('scroll', handleScroll);
      } else {
        scrollWrapper.value?.removeEventListener('scroll', handleScroll);
      }
    }, { deep: true });

    return {
      ROUTE_ADDRESS_BOOK_EDIT,
      ROUTE_ADDRESS_BOOK,
      ACCOUNT_SELECT_TYPE_FILTER,
      scrollWrapperEl,
      isSearchVisible,
      hasBookmarkedEntries,
      accountsFiltered,
      accountSelectType,
      searchQuery,
      noRecordsMessage,
      protocolName,
      bgColorStyle,
      accountIcon,
      selectAddress,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.address-book-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  padding: 8px;

  .address-book-header {
    box-shadow: none;
  }

  .address-book-item {
    background-color: var(--bg-color);
    border: var(--border-width) solid var(--bg-color);
    padding: 8px 2px 8px 8px;
  }

  .search-field {
    margin-bottom: 16px;
  }

  .message {
    @extend %face-sans-15-medium;

    display: flex;
    justify-content: center;
    align-items: center;
    color: $color-grey-light;
    text-align: center;
    padding: 40px 8px 16px;
  }

  .account-type-icon {
    width: 20px;
    height: 20px;
    opacity: 0.85;
  }

  .add-record-button {
    width: 100%;
    gap: 4px;
  }
}
</style>
