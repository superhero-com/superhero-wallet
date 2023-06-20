<template>
  <div class="tips-claim">
    <AccountInfo
      :address="activeAccount.address"
      :name="activeAccount.name"
      :idx="activeAccount.idx"
    />

    <div class="header">
      <p class="text-description">
        {{ $t('pages.claimTips.header') }}
      </p>

      <BtnHelp
        class="help-button"
        :title="$t('modals.verify.title')"
        :msg="$t('modals.verify.msg')"
        :option="{
          attrs: {
            href: BLOG_CLAIM_TIP_URL,
            target: '_blank'
          },
        }"
        icon="success"
      />
    </div>

    <InputField
      v-model="url"
      :label="$t('pages.claimTips.urlToClaim')"
      :error="!normalizedUrl"
    />

    <BtnMain
      :disabled="!normalizedUrl || !tippingSupported"
      extend
      @click="claimTips"
    >
      {{ $t('common.confirm') }}
    </BtnMain>

    <Loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import { useStore } from 'vuex';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import {
  BLOG_CLAIM_TIP_URL,
  MODAL_CLAIM_SUCCESS,
  aettosToAe,
  toURL,
  validateTipUrl,
  watchUntilTruthy,
} from '../utils';
import { IS_EXTENSION } from '../../lib/environment';
import { ROUTE_ACCOUNT } from '../router/routeNames';

import { useAccounts, useModals } from '../../composables';
import { useGetter, useState } from '../../composables/vuex';

import InputField from '../components/InputField.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import BtnHelp from '../components/buttons/BtnHelp.vue';
import AccountInfo from '../components/AccountInfo.vue';

export default {
  components: {
    InputField,
    BtnMain,
    BtnHelp,
    AccountInfo,
  },
  setup() {
    const store = useStore();
    const { t } = useI18n();
    const router = useRouter();

    const { activeAccount } = useAccounts({ store });
    const { openModal, openDefaultModal } = useModals();

    const url = ref('');
    const loading = ref(false);

    const tippingV1 = useState('tippingV1');
    const sdk = useGetter('sdkPlugin/sdk');
    const tippingSupported = useGetter('tippingSupported');

    const normalizedUrl = computed(() => {
      if (!validateTipUrl(url.value)) {
        return '';
      }
      return toURL(url.value).toString();
    });

    async function claimTips() {
      const _url = normalizedUrl;
      loading.value = true;
      await watchUntilTruthy(() => sdk && tippingV1.value);
      try {
        const claimAmount = parseFloat(
          aettosToAe(
            await tippingV1.value.methods
              .unclaimed_for_url(_url)
              .then((r: any) => r.decodedResult)
              .catch(() => 1),
          ),
        );
        if (!claimAmount) {
          throw new Error('NO_ZERO_AMOUNT_PAYOUT');
        }
        await store.dispatch('claimTips', { url: _url.value, address: activeAccount.value.address });
        await store.dispatch('cacheInvalidateOracle');
        await store.dispatch('cacheInvalidateTips');

        openModal(MODAL_CLAIM_SUCCESS, { url: _url, claimAmount });

        router.push({ name: ROUTE_ACCOUNT });
      } catch (e: any) {
        const { error = '' } = e.response ? e.response.data : {};
        let msg;
        if (error.includes('MORE_ORACLES_NEEDED')) msg = t('pages.claim.moreOracles');
        else if (error.includes('URL_NOT_EXISTING')) msg = t('pages.claim.urlNotExisting');
        else if (
          error.includes('NO_ZERO_AMOUNT_PAYOUT')
          || e.message.includes('NO_ZERO_AMOUNT_PAYOUT')
        ) msg = t('pages.claim.noZeroClaim');
        else if (error.includes('ORACLE_SEVICE_CHECK_CLAIM_FAILED')) msg = t('pages.claim.oracleFailed');
        else if (error) msg = error;
        if (msg) {
          openDefaultModal({ msg });
        } else {
          e.payload = { url: _url };
          throw e;
        }
      } finally {
        loading.value = false;
      }
    }

    onMounted(async () => {
      if (IS_EXTENSION) {
        const [tab] = await browser?.tabs.query({ active: true, currentWindow: true });
        if (tab && validateTipUrl(tab.url)) {
          url.value = tab.url;
        }
      }
    });

    return {
      BLOG_CLAIM_TIP_URL,
      tippingSupported,
      normalizedUrl,
      activeAccount,
      loading,
      url,
      claimTips,
    };
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.tips-claim {
  padding: 12px;

  .header {
    margin: 20px 0 24px 0;
    display: flex;

    .help-button {
      margin-left: 8px;

      :deep(.icon) {
        width: 32px;
        height: 32px;
      }
    }
  }

  .input-field {
    margin: 20px 0;
  }
}
</style>
