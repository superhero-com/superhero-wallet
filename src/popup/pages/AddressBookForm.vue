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
              use-address-for-avatar
            />
            <BtnPill
              variant="dark"
              @click="toggleBookmark()"
            >
              <IconWrapper
                :icon="FavoriteIcon"
                icon-size="rg"
                :class="{ yellow: entry.isBookmarked }"
              />
              {{
                entry.isBookmarked
                  ? $t('pages.addressBook.entry.bookmarked')
                  : $t('pages.addressBook.entry.bookmark')
              }}
            </BtnPill>
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
            v-slot="{ field }"
            name="name"
            :model-value="entry.name"
            :validate-on-mount="!!entry.name"
            :rules="{ required: true }"
          >
            <!-- TODO Add validation, name/address already on address book -->
            <FormTextarea
              v-bind="field"
              v-model="entry.name"
              name="name"
              data-cy="name"
              auto-height
              :label="$t('common.name')"
              :placeholder="$t('pages.addressBook.entry.namePlaceholder')"
            />
          </Field>

          <Field
            v-slot="{ field }"
            name="address"
            :model-value="entry.address"
            :validate-on-mount="!!entry.address"
            :rules="{ required: true }"
          >
            <FormTextarea
              v-bind="field"
              v-model="entry.address"
              name="address"
              data-cy="address"
              auto-height
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
import { ROUTE_ADDRESS_BOOK_EDIT } from '@/popup/router/routeNames';
import { IAddressBookEntry, useAddressBook, useModals } from '@/composables';

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
    const defaultName = 'Custom Name';
    const defaultAddress = 'xx_AbCXyZ';
    const isPlaceholder = ref(true);
    const entry = ref<Partial<IAddressBookEntry>>({
      name: '',
      address: '',
      isBookmarked: false,
    });

    const route = useRoute();
    const ionRouter = useIonRouter();
    const { openScanQrModal } = useModals();
    const {
      addAddressBookEntry,
      toggleBookmarkAddressBookEntry,
      getAddressBookEntryByAddress,
      removeAddressBookEntry,
    } = useAddressBook();

    const isEdit = route.name === ROUTE_ADDRESS_BOOK_EDIT;

    const accountName = computed(() => isPlaceholder.value ? defaultName : entry.value.name);
    const accountAddress = computed(
      () => isPlaceholder.value ? defaultAddress : entry.value.address,
    );
    const account = computed(() => ({
      name: accountName.value,
      address: accountAddress.value,
      protocol: entry.value.protocol,
    }));

    function goBack() {
      ionRouter.back();
    }

    function confirm() {
      if (entry.value.name && entry.value.address) {
        addAddressBookEntry(entry.value as IAddressBookEntry, isEdit);
        goBack();
      }
    }

    function deleteEntry() {
      if (entry.value.address) {
        removeAddressBookEntry(entry.value.address);
        goBack();
      }
    }

    function toggleBookmark() {
      if (entry.value.address) {
        entry.value.isBookmarked = !entry.value.isBookmarked;
        toggleBookmarkAddressBookEntry(entry.value.address);
      }
    }

    async function scanQr() {
      const scanResult = await openScanQrModal({
        title: tg('pages.addressBook.scanTitle'),
      });

      if (scanResult) {
        entry.value.address = scanResult;
      }
    }

    watch(entry, (newEntry) => {
      // TODO validate Address, only if address is valid then set isPlaceholder to false
      isPlaceholder.value = !(newEntry.name && newEntry.address);
    }, { deep: true });

    onMounted(() => {
      if (isEdit) {
        const addressBookEntry = getAddressBookEntryByAddress(route.params.id as string);
        if (addressBookEntry) {
          entry.value = { ...toRaw(addressBookEntry) };
        }
      }
    });

    return {
      account,
      accountName,
      entry,
      isPlaceholder,
      isEdit,

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

    .main-buttons {
      display: flex;
      flex-flow: row;
      gap: 8px;
    }
  }

}
</style>
