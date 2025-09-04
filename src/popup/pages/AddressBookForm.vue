<template>
  <IonPage class="address-book-form">
    <IonContent class="ion-padding ion-content-bg">
      <div class="address-book-form-content">
        <div class="top-part">
          <div class="info">
            <AccountInfo
              class="account-info"
              :account="account"
              :custom-name="accountName"
              :is-placeholder="isPlaceholder"
              :avatar-borderless="isPlaceholder"
              :show-protocol-icon="!isPlaceholder"
              :show-super-icon="!isPlaceholder"
              :show-explorer-link="!isPlaceholder"
            />
            <Field
              v-slot="{ field }"
              name="isBookmarked"
              :model-value="formModel.isBookmarked"
            >
              <BtnPill
                class="bookmark-button"
                variant="dark"
                @click="toggleBookmark()"
              >
                <IconWrapper
                  :icon="FavoriteIcon"
                  icon-size="rg"
                  class="icon"
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
          <BtnIcon
            class="qrcode-wrapper"
            :disabled="isPlaceholder"
            @click="shareAddress()"
          >
            <QrCode
              :value="[account.address ?? '']"
              :size="116"
              class="qrcode"
              :class="{ hidden: isPlaceholder }"
              disable-click-to-copy
            />
          </BtnIcon>
        </div>
        <div class="inputs">
          <Field
            v-slot="{ field, errorMessage }"
            name="name"
            :model-value="formModel.name"
            :validate-on-mount="!!formModel.name"
            :rules="{
              required: true,
              address_book_entry_exists: [addressBook, savedEntry?.name, 'name'],
              max_len: 33,
            }"
          >
            <FormTextarea
              v-bind="field"
              v-model="formModel.name"
              name="name"
              data-cy="name"
              auto-height
              :text-limit="33"
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
              account_address: true,
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
                <BtnIcon
                  :icon="QrScanIcon"
                  data-cy="scan-button"
                  @click="scanQr()"
                />
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
        v-if="savedEntry?.address"
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
import { ROUTE_ADDRESS_BOOK } from '@/popup/router/routeNames';
import {
  useAddressBook,
  useAddressBookEntryForm,
  useModals,
} from '@/composables';

import AccountInfo from '@/popup/components/AccountInfo.vue';
import BtnPill from '@/popup/components/buttons/BtnPill.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';
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
    BtnIcon,
    QrCode,
    IconWrapper,
    FixedScreenFooter,
    Field,
  },
  setup() {
    const defaultName = tg('pages.addressBook.entry.customName');
    const defaultAddress = 'xx_AbCXyZ';
    const isPlaceholder = ref(true);
    const savedEntry = ref<Partial<IAddressBookEntry>>({});

    const route = useRoute();
    const ionRouter = useIonRouter();
    const { openScanQrModal, openShareAddressModal } = useModals();
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
        addAddressBookEntry(formModel.value as IAddressBookEntry, savedEntry.value.address);
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
      formModel.value.isBookmarked = !formModel.value.isBookmarked;
      if (savedEntry.value.address) {
        toggleBookmarkAddressBookEntry(savedEntry.value.address);
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

    function shareAddress() {
      if (
        !isPlaceholder.value
        && formModel.value.address
        && formModel.value.name
        && protocol.value
      ) {
        openShareAddressModal({
          address: formModel.value.address,
          protocol: protocol.value,
          title: formModel.value.name,
        });
      }
    }

    watch([formModel, hasError], ([newEntry, newHasError]) => {
      isPlaceholder.value = !(newEntry.name && newEntry.address) || newHasError;
    }, { deep: true });

    onMounted(() => {
      if (typeof route.params.id === 'string') {
        const addressBookEntry = getAddressBookEntryByAddress(route.params.id);
        if (addressBookEntry) {
          savedEntry.value = addressBookEntry;
          updateFormModelValues({ ...toRaw(addressBookEntry) });
        } else {
          ionRouter.navigate({ name: ROUTE_ADDRESS_BOOK }, 'back', 'replace');
        }
      }
    });

    return {
      account,
      accountName,
      formModel,
      isPlaceholder,
      addressBook,
      savedEntry,
      hasError,

      scanQr,
      goBack,
      confirm,
      deleteEntry,
      toggleBookmark,
      shareAddress,

      FavoriteIcon,
      QrScanIcon,
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

        .account-info {
          --maxWidth: 155px;
        }

        .bookmark-button {
          display: flex;
          gap: 4px;
          padding: 8px 16px;
          min-width: 138px;
          border-radius: 10px;
          font-weight: 500;
          color: $color-white;
          background-color: rgba($color-white, 0.08);

          .icon {
            color: rgba($color-white, 0.50);

            &.yellow {
              color: $color-warning;
            }
          }

          &:hover {
            background-color: rgba($color-white, 0.05);
            color: rgba($color-white, 0.8);
          }
        }
      }

      .qrcode-wrapper {
        border-radius: 12px;
        background-color: rgba($color-white, 0.15);

        .qrcode {
          display: inline-flex;
          border-radius: 12px;
          height: 116px;
          width: 116px;
          padding: 8px;
          background-color: $color-white;
          object-fit: contain;

          &.hidden {
            opacity: 0;
          }
        }
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
