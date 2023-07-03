<template>
  <Modal
    class="form-select-options"
    from-bottom
    has-close-button
    no-padding
    @close="reject()"
  >
    <template #header>
      <FormSelectOptionsHeader
        v-model="searchPhrase"
        :title="title"
        :options-length="options.length"
      />
    </template>

    <div>
      <FormSelectOptionsItem
        v-for="(option, index) in optionsFiltered"
        :key="index"
        :option="option"
        @click="resolve(option.value)"
      />
    </div>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
} from 'vue';
import type { IFormSelectOption, RejectCallback, ResolveCallback } from '../../../types';

import Modal from '../Modal.vue';
import FormSelectOptionsItem from '../FormSelectOptionsItem.vue';
import FormSelectOptionsHeader from '../FormSelectOptionsHeader.vue';

export default defineComponent({
  components: {
    FormSelectOptionsHeader,
    FormSelectOptionsItem,
    Modal,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    title: { type: String, default: null },
    value: { type: [String, Number], default: null },
    options: { type: Array as PropType<IFormSelectOption[]>, default: () => [] },
  },
  setup(props) {
    const searchPhrase = ref('');

    const optionsFiltered = computed(() => (
      props.options.filter(({ text, value }) => (
        text.toLowerCase().includes(searchPhrase.value)
        || value.toString().includes(searchPhrase.value)
      ))
    ));

    return {
      searchPhrase,
      optionsFiltered,
    };
  },
});
</script>
