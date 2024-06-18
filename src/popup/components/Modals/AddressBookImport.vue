<template>
  <Modal
    class="address-book-import"
    has-close-button
    body-without-padding-bottom
    v-on="{ close: resolve }"
  >
    <div class="top-icon-wrapper">
      <IconBoxed
        :icon="ImportIcon"
        class="icon"
        icon-smaller
        is-boxed
      />
    </div>

    <h2
      class="text-heading-2 text-center title"
      v-text="$t('pages.addressBook.import.title')"
    />
    <p
      class="text-center subtitle"
      v-text="$t('pages.addressBook.import.subtitle')"
    />

    <Panel>
      <PanelTableItem :name="$t('pages.addressBook.import.importing')">
        {{ totalEntries }}
      </PanelTableItem>
      <PanelTableItem :name="$t('pages.addressBook.import.success')">
        {{ successfulEntriesCount }}
      </PanelTableItem>
      <PanelTableItem :name="$t('pages.addressBook.import.failed')">
        {{ totalEntries - successfulEntriesCount - existingEntriesCount }}
      </PanelTableItem>
      <PanelTableItem :name="$t('pages.addressBook.import.existing')">
        {{ existingEntriesCount }}
      </PanelTableItem>
    </Panel>

    <template #footer>
      <BtnMain
        :text="$t('common.ok')"
        @click="resolve"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { ResolveCallback, RejectCallback } from '@/types';

import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';
import Panel from '@/popup/components/Panel.vue';
import PanelTableItem from '@/popup/components/PanelTableItem.vue';

import ImportIcon from '@/icons/import-address-book.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    Panel,
    PanelTableItem,
    IconBoxed,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    totalEntries: { type: Number, default: 0 },
    successfulEntriesCount: { type: Number, default: 0 },
    existingEntriesCount: { type: Number, default: 0 },
  },
  data() {
    return {
      ImportIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.address-book-import {
  .title {
    @extend %face-sans-19-medium;

    margin-bottom: 4px;
  }

  .subtitle {
    @extend %face-sans-16-medium;

    opacity: 0.75;
    margin-bottom: 20px;
  }

  .top-icon-wrapper {
    margin-bottom: 20px;
    text-align: center;

    .icon {
      color: $color-primary;
      border-color: $color-bg-1;
      outline: 4px solid rgba($color-white, 0.05);
      background-color: rgba($color-primary, 0.2);
    }
  }
}
</style>
