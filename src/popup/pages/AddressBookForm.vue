<template>
  <IonPage class="address-book-form">
    <IonContent class="ion-padding ion-content-bg">
      <div class="address-book-form-content">
        <div class="top-part">
          <div class="info">
            <AccountInfo
              :account="account"
              :custom-name="accountName"
              :is-placeholder="isPlaceholder"
              :avatar-borderless="isPlaceholder"
              :show-protocol-icon="!isPlaceholder"
              :max-width="155"
              use-address-for-avatar
            />
            <Field
              v-slot="{ field }"
              name="isBookmarked"
              :model-value="formModel.isBookmarked"
            >
              <BtnPill
                variant="dark"
                @click="toggleBookmark()"
              >
                <IconWrapper
                  :icon="FavoriteIcon"
                  icon-size="rg"
                  :class="{ yellow: field.value }"
                />
                {{
                  field.value
                    ? $t('pages.addressBook.entry.bookmarked')
                    : $t('pages.addressBook.entry.bookmark')
                }}
              </BtnPill>
            </Field>
          </div>
          <div class="qrcode-wrapper">
            <QrCode
              :value="account.address ?? ''"
              :size="116"
              class="qrcode"
              :class="{ hidden: isPlaceholder }"
            />
          </div>
        </div>
        <div class="inputs">
          <Field
            v-slot="{ field, errorMessage }"
            name="name"
            :model-value="formModel.name"
            :validate-on-mount="!!formModel.name"
            :rules="{
              required: true,
              address_book_entry_exists: [addressBook, savedEntry?.address, 'name'],
              max_len: 50,
            }"
          >
            <FormTextarea
              v-bind="field"
              v-model="formModel.name"
              name="name"
              data-cy="name"
              auto-height
              :message="errorMessage"
              :label="$t('common.name')"
              :placeholder="$t('pages.addressBook.entry.namePlaceholder')"
            />
          </Field>

          <Field
            v-slot="{ field, errorMessage }"
            name="address"
            :model-value="formModel.address"
            :validate-on-mount="!!formModel.address"
            :rules="{
              required: true,
              address_book_entry_exists: [addressBook, savedEntry?.address, 'address'],
              is_address_valid: true,
            }"
          >
            <FormTextarea
              v-bind="field"
              v-model="formModel.address"
              name="address"
              data-cy="address"
              auto-height
              :message="errorMessage"
              :label="$t('common.address')"
              :placeholder="$t('pages.addressBook.entry.addressPlaceholder')"
            >
              <template #label-after>
                <BtnPlain
                  class="scan-button"
                  data-cy="scan-button"
                  @click="scanQr()"
                >
                  <QrScanIcon />
                </BtnPlain>
              </template>
            </FormTextarea>
          </Field>
        </div>
      </div>
    </IonContent>
    <FixedScreenFooter class="footer">
      <div class="main-buttons">
        <BtnMain
          variant="muted"
          :text="$t('common.cancel')"
          @click="goBack()"
        />
        <BtnMain
          :disabled="isPlaceholder"
          :text="$t('common.confirm')"
          extra-padded
          @click="confirm()"
        />
      </div>
      <BtnMain
        v-if="isEdit"
        variant="muted"
        :text="$t('pages.addressBook.entry.delete')"
        :icon="TrashIcon"
        extend
        @click="deleteEntry()"
      />
    </FixedScreenFooter>
  </IonPage>
</template>

<script lang="ts">
import { IonContent, IonPage, useIonRouter } from '@ionic/vue';
import {
  defineComponent,
  computed,
  watch,
  ref,
  onMounted,
  toRaw,
} from 'vue';
import { Field } from 'vee-validate';
import { useRoute } from 'vue-router';

import { tg } from '@/popup/plugins/i18n';
import type { IAddressBookEntry } from '@/types';
import { ROUTE_ADDRESS_BOOK_EDIT } from '@/popup/router/routeNames';
import {
  useAddressBook,
  useAddressBookEntryForm,
  useModals,
} from '@/composables';

import AccountInfo from '@/popup/components/AccountInfo.vue';
import BtnPill from '@/popup/components/buttons/BtnPill.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import BtnPlain from '@/popup/components/buttons/BtnPlain.vue';
import FormTextarea from '@/popup/components/form/FormTextarea.vue';
import QrCode from '@/popup/components/QrCode.vue';
import IconWrapper from '@/popup/components/IconWrapper.vue';
import FixedScreenFooter from '@/popup/components/FixedScreenFooter.vue';

import QrScanIcon from '@/icons/qr-scan.svg?vue-component';
import FavoriteIcon from '@/icons/star-full.svg?vue-component';
import TrashIcon from '@/icons/trash.svg?vue-component';
import { getProtocolByAddress } from '@/utils';

export default defineComponent({
  components: {
    IonPage,
    IonContent,
    AccountInfo,
    FormTextarea,
    BtnMain,
    BtnPill,
    BtnPlain,
    QrCode,
    IconWrapper,
    FixedScreenFooter,
    Field,
    QrScanIcon,
  },
  setup() {
    const defaultName = tg('pages.addressBook.entry.customName');
    const defaultAddress = 'xx_AbCXyZ';
    const isPlaceholder = ref(true);
    const savedEntry = ref<Partial<IAddressBookEntry>>({});

    const route = useRoute();
    const ionRouter = useIonRouter();
    const { openScanQrModal } = useModals();
    const {
      addressBook,
      addAddressBookEntry,
      toggleBookmarkAddressBookEntry,
      getAddressBookEntryByAddress,
      removeAddressBookEntry,
    } = useAddressBook();
    const { formModel, hasError, updateFormModelValues } = useAddressBookEntryForm(
      { addressBookEntryData: {} },
    );

    const isEdit = route.name === ROUTE_ADDRESS_BOOK_EDIT;

    const accountName = computed(() => isPlaceholder.value ? defaultName : formModel.value.name);
    const accountAddress = computed(
      () => isPlaceholder.value ? defaultAddress : formModel.value.address,
    );
    const protocol = computed(
      () => formModel.value.address ? getProtocolByAddress(formModel.value.address) : undefined,
    );
    const account = computed(() => ({
      name: accountName.value,
      address: accountAddress.value,
      protocol: protocol.value,
    }));

    function goBack() {
      ionRouter.back();
    }

    function confirm() {
      if (!hasError.value) {
        addAddressBookEntry(formModel.value as IAddressBookEntry, isEdit);
        goBack();
      }
    }

    function deleteEntry() {
      if (savedEntry.value.address) {
        removeAddressBookEntry(savedEntry.value.address);
        goBack();
      }
    }

    function toggleBookmark() {
      if (formModel.value.address) {
        formModel.value.isBookmarked = !formModel.value.isBookmarked;
        toggleBookmarkAddressBookEntry(formModel.value.address);
      }
    }

    async function scanQr() {
      const scanResult = await openScanQrModal({
        title: tg('pages.addressBook.scanTitle'),
      });

      if (scanResult) {
        formModel.value.address = scanResult;
      }
    }

    watch([formModel, hasError], ([newEntry, newHasError]) => {
      isPlaceholder.value = !(newEntry.name && newEntry.address) || newHasError;
    }, { deep: true });

    onMounted(() => {
      if (isEdit) {
        const addressBookEntry = getAddressBookEntryByAddress(route.params.id as string);
        if (addressBookEntry) {
          savedEntry.value = addressBookEntry;
          updateFormModelValues({ ...toRaw(addressBookEntry) });
        }
      }
    });

    return {
      account,
      accountName,
      formModel,
      isPlaceholder,
      isEdit,
      addressBook,
      savedEntry,
      hasError,

      scanQr,
      goBack,
      confirm,
      deleteEntry,
      toggleBookmark,

      FavoriteIcon,
      TrashIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.address-book-form {
  &-content {
    padding: 16px;

    .top-part {
      display: flex;
      justify-content: space-between;
      height: auto;
      margin-bottom: 16px;

      .info {
        display: flex;
        flex-flow: column;
        align-items: flex-start;
        justify-content: space-between;

        .yellow {
          color: $color-warning;
        }
      }

      .qrcode-wrapper {
        border-radius: 12px;
        background-color: rgba($color-white, 0.15);

        .qrcode {
          display: inline-flex;
          border-radius: 12px;
          height: 116px;
          padding: 8px;
          background-color: $color-white;
          object-fit: contain;

          &.hidden {
            opacity: 0;
          }
        }
      }
    }

    .inputs {
      .scan-button {
        display: block;
        width: 32px;
        height: 24px;
        color: $color-white;
      }
    }
  }

  .footer {
    display: flex;
    flex-flow: column;
    background-color: $color-bg-app;

    .main-buttons {
      display: flex;
      flex-flow: row;
      gap: 8px;
    }
  }

}
</style>
