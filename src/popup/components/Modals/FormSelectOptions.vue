<template>
  <Modal
    class="form-select-options"
    from-bottom
    has-close-button
    no-padding
    @close="reject()"
  >
    <template #header>
      <div class="header">
        <span class="text-heading-3 title">{{ title }}</span>
        <InputSearch
          v-if="options.length > 3"
          v-model="searchTerm"
          class="search-field"
          :placeholder="$t('common.search')"
        />
      </div>
    </template>

    <div>
      <ListItemWrapper
        v-for="(option, index) in optionsFiltered"
        :key="index"
        :selected="(option.value === value)"
        @click.prevent="resolve(option.value)"
      >
        <div class="option-wrapper">
          <Avatar
            v-if="option.address"
            :address="option.address"
            size="sm"
          />
          {{ option.text }}
        </div>
      </ListItemWrapper>
    </div>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
} from '@vue/composition-api';
import type { IFormSelectOption } from '../../../types';

import InputSearch from '../InputSearch.vue';
import Modal from '../Modal.vue';
import ListItemWrapper from '../ListItemWrapper.vue';
import Avatar from '../Avatar.vue';

export default defineComponent({
  components: {
    Modal,
    ListItemWrapper,
    InputSearch,
    Avatar,
  },
  props: {
    // eslint-disable-next-line no-unused-vars
    resolve: { type: Function as PropType<(o: any) => any>, required: true },
    reject: { type: Function, required: true },
    title: { type: String, default: null },
    value: { type: [String, Number], default: null },
    options: { type: Array as PropType<IFormSelectOption[]>, default: () => [] },
  },
  setup(props) {
    const searchTerm = ref('');
    const optionsFiltered = computed((): IFormSelectOption[] => {
      if (searchTerm.value) {
        const searchTermLower = searchTerm.value.toLowerCase();
        return props.options.filter(({ text, value }) => (
          text.toLowerCase().includes(searchTermLower)
          || value.toString().includes(searchTermLower)
        ));
      }
      return props.options;
    });

    return {
      searchTerm,
      optionsFiltered,
    };
  },
});
</script>

<style lang="scss" scoped>
.form-select-options {
  .header {
    margin-inline: var(--screen-padding-x);
    text-align: left;
  }

  .title {
    padding-left: 12px;
    line-height: 48px;
  }

  .search-field {
    margin-bottom: var(--gap);
  }

  .option-wrapper {
    display: flex;
    gap: 8px;
    align-items: center;
    padding-block: 4px;
  }
}
</style>
