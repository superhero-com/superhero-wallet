<template>
  <div class="address-book-list">
    <IonHeader class="address-book-header">
      <Transition name="fade-between">
        <InputSearch
          v-if="isScrolled || searchQuery"
          v-model="searchQuery"
          :placeholder="$t('pages.addressBook.searchPlaceholder')"
          class="search-field"
        />
      </Transition>

      <AddressBookFilters />
    </IonHeader>
    <IonContent ref="scrollWrapperEl" class="ion-padding ion-content-bg">
      <div
        v-if="Object.keys(addressBookFiltered).length"
        class="list"
      >
        <AddressBookItem
          v-for="(entry) in addressBookFiltered"
          :key="entry.name"
          :item="entry"
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
import type { ComponentRef } from '@/types';
import { ROUTE_ADDRESS_BOOK } from '@/popup/router/routeNames';
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
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const scrollWrapperEl = ref<ComponentRef>();
    const isScrolled = ref(false);

    const {
      addressBookFiltered,
      protocolFilter,
      searchQuery,
      showBookmarked,
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

    const handleScroll = throttle(() => {
      if (!scrollWrapper.value) return;
      isScrolled.value = scrollWrapper.value?.scrollTop > 0;
      emit('update:modelValue', (isScrolled.value || !!searchQuery.value));
    }, 100);

    onMounted(() => {
      scrollWrapper.value?.addEventListener('scroll', handleScroll);
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
      isScrolled,
      searchQuery,
      addressBookFiltered,
      noRecordsMessage,
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
