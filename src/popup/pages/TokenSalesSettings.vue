<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="token-sales-settings">
        <p
          class="text-description"
          v-text="$t('pages.tokenSales.heading')"
        />

        <InputField
          v-model.trim="tokenSalesUrl"
          :label="$t('pages.tokenSales.inputLabel')"
          :placeholder="$t('pages.tokenSales.inputPlaceholder')"
          type="url"
          :message="error"
          @input="error = ''"
        />
        <div class="buttons">
          <BtnMain
            variant="muted"
            class="cancel-button"
            :to="{ name: ROUTE_SETTINGS }"
          >
            {{ $t('common.cancel') }}
          </BtnMain>
          <BtnMain
            wide
            :disabled="!tokenSalesUrl || loading || !!error"
            @click="addTokenSalesUrl()"
          >
            <IonSpinner
              v-if="loading"
              class="icon"
              name="circular"
            />
            <PlusIcon
              v-else
              class="icon"
            />

            {{ $t('pages.tokenSales.addUrl') }}
          </BtnMain>
        </div>
        <div
          v-if="tokenSalesUrls.length"
          class="url-list"
        >
          <h2
            class="text-label"
            v-text="$t('pages.tokenSales.urlListLabel')"
          />
          <div
            v-for="url in tokenSalesUrls"
            :key="url"
            class="custom-url"
          >
            <LinkButton
              :href="url"
              is-external
              variant="muted"
            >
              <p
                class="url"
                v-text="url"
              />
            </LinkButton>
            <BtnIcon
              :icon="TrashIcon"
              class="btn-icon"
              @click="removeCustomTokenSalesUrl(url)"
            />
          </div>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue';
import { IonPage, IonContent, IonSpinner } from '@ionic/vue';

import { useNetworks } from '@/composables';
import { useAeTokenSales } from '@/protocols/aeternity/composables/aeTokenSales';
import { ROUTE_SETTINGS } from '@/popup/router/routeNames';

import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import InputField from '@/popup/components/InputField.vue';
import LinkButton from '@/popup/components/LinkButton.vue';

import PlusIcon from '@/icons/plus-circle.svg?vue-component';
import TrashIcon from '@/icons/trash.svg?vue-component';
import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';

export default defineComponent({
  components: {
    IonPage,
    IonContent,
    InputField,
    BtnMain,
    LinkButton,
    IonSpinner,
    BtnIcon,
    PlusIcon,
  },
  setup() {
    const {
      customTokenSalesUrls,
      addCustomTokenSalesUrl,
      removeCustomTokenSalesUrl,
      validateTokenSalesUrl,
    } = useAeTokenSales();

    const { activeNetwork } = useNetworks();

    const error = ref('');
    const loading = ref(false);
    const tokenSalesUrl = ref('');

    const tokenSalesUrls = computed(() => (
      customTokenSalesUrls.value[activeNetwork.value.name] || []
    ));

    async function addTokenSalesUrl() {
      loading.value = true;
      const url = /^http[s]*:\/\//.test(tokenSalesUrl.value) ? tokenSalesUrl.value : `https://${tokenSalesUrl.value}`;
      const { error: validationError } = await validateTokenSalesUrl(url);
      if (validationError) {
        error.value = validationError;
        loading.value = false;
        return;
      }
      addCustomTokenSalesUrl(url);
      tokenSalesUrl.value = '';
      loading.value = false;
    }

    return {
      ROUTE_SETTINGS,
      TrashIcon,

      customTokenSalesUrls,
      error,
      loading,
      tokenSalesUrl,
      tokenSalesUrls,

      addTokenSalesUrl,
      removeCustomTokenSalesUrl,
    };
  },
});

</script>

<style lang="scss" scoped>
.token-sales-settings {
  padding-top: 16px;
  padding-inline: var(--screen-padding-x);

  .buttons {
    margin-top: 36px;
    display: flex;
    gap: 8px;

    .icon {
      width: 20px;
      height: 20px;
      margin-right: 4px;
    }
  }

  .url-list {
    margin-top: 36px;

    .text-label {
      line-height: 24px;
    }

    .custom-url {
      display: flex;
      justify-content: space-between;

      .url {
        white-space: nowrap;
        text-overflow: ellipsis;
        max-width: 265px;
        overflow: hidden;
      }

      .btn-icon {
        opacity: 0.5;
        padding: 0;

        &:hover {
          opacity: 1;
        }
      }
    }
  }
}
</style>
