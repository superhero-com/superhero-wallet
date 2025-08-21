import {
  computed,
  ref,
} from 'vue';
import { useForm } from 'vee-validate';

import { IAddressBookEntry } from '@/types';

interface UseAddressBookEntryForm {
  addressBookEntryData: Partial<IAddressBookEntry>;
}

export function useAddressBookEntryForm({
  addressBookEntryData,
}: UseAddressBookEntryForm) {
  const formModel = ref(addressBookEntryData);

  const { errors } = useForm();

  const hasError = computed(
    (): boolean => Object.keys(errors.value).length > 0,
  );

  async function updateFormModelValues(values: IAddressBookEntry) {
    const { protocol: _, ...cleanValues } = values;
    formModel.value = {
      ...formModel.value,
      ...cleanValues,
    };
  }

  return {
    formModel,
    errors,
    hasError,
    updateFormModelValues,
  };
}
