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
        v-if="!isSelector || hasBookmarkedEntries"
        :is-selector="isSelector"
      />
    </IonHeader>
    <IonContent
      ref="scrollWrapperEl"
      class="ion-padding"
      :class="{ 'ion-content-bg': !isSelector }"
    >
      <div
        v-if="Object.keys(addressBookFiltered).length"
        class="list"
      >
        <AddressBookItem
          v-for="(entry) in addressBookFiltered"
          :key="entry.name"
          :item="entry"
          @click="handleAddressBookItemClick(entry)"
        />
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
import { IonHeader, IonContent } from '@ionic/vue';
import { useRoute } from 'vue-router';

import { tg } from '@/popup/plugins/i18n';
import { ComponentRef, IAddressBookEntry } from '@/types';
import { ROUTE_ADDRESS_BOOK } from '@/popup/router/routeNames';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useAddressBook } from '@/composables';

import InputSearch from '@/popup/components/InputSearch.vue';
import AddressBookItem from '@/popup/components/AddressBook/AddressBookItem.vue';
import AddressBookFilters from '@/popup/components/AddressBook/AddressBookFilters.vue';

export default defineComponent({
  components: {
    IonHeader,
    IonContent,
    AddressBookItem,
    AddressBookFilters,
    InputSearch,
  },
  props: {
    modelValue: Boolean,
    /** Whether the list is being used in an account selector or not  */
    isSelector: Boolean,
  },
  emits: ['update:hideButtons', 'select-address'],
  setup(props, { emit }) {
    const scrollWrapperEl = ref<ComponentRef>();
    const isScrolled = ref(false);

    const {
      addressBookFiltered,
      addressBookFilteredByProtocol,
      protocolFilter,
      searchQuery,
      showBookmarked,
      setShowBookmarked,
    } = useAddressBook();
    const route = useRoute();

    const noRecordsMessage = computed(() => {
      switch (true) {
        case !!searchQuery.value: return tg('pages.addressBook.noRecords.search');
        case protocolFilter.value === null: return tg('pages.addressBook.noRecords.addressBook');
        case showBookmarked.value: return tg('pages.addressBook.noRecords.bookmarked');
        default: return tg('pages.addressBook.noRecords.blockchain');
      }
    });
    const scrollWrapper = computed(() => scrollWrapperEl.value?.$el);
    const protocolName = computed(() => (protocolFilter.value)
      ? ProtocolAdapterFactory.getAdapter(protocolFilter.value)?.protocolName
      : '');
    const hideOuterButtons = computed(() => isScrolled.value || !!searchQuery.value);
    const isSearchVisible = computed(() => (
      (!protocolFilter.value || props.isSelector || showBookmarked.value)
      && Object.keys(addressBookFilteredByProtocol.value).length > 9
    ) || hideOuterButtons.value);
    const hasBookmarkedEntries = computed(
      () => addressBookFilteredByProtocol.value.some((entry) => entry.isBookmarked),
    );

    function handleAddressBookItemClick(entry: IAddressBookEntry) {
      if (entry) {
        emit('select-address', entry.address);
      }
    }

    const handleScroll = throttle(() => {
      if (!scrollWrapper.value) return;
      isScrolled.value = scrollWrapper.value?.scrollTop > 0;
      emit('update:hideButtons', hideOuterButtons.value);
    }, 100);

    onMounted(() => {
      scrollWrapper.value?.addEventListener('scroll', handleScroll);
      setShowBookmarked(props.isSelector && hasBookmarkedEntries.value, !props.isSelector);
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
      scrollWrapperEl,
      isSearchVisible,
      hasBookmarkedEntries,
      searchQuery,
      addressBookFiltered,
      noRecordsMessage,
      protocolName,
      handleAddressBookItemClick,
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

  .search-field {
    margin-bottom: 16px;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .message {
    @extend %face-sans-15-medium;

    display: flex;
    justify-content: center;
    align-items: center;
    color: $color-grey-light;
    text-align: center;
    padding: 40px 8px;
  }
}
</style>
