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
      v-model="tipUrl"
      :label="$t('pages.claimTips.urlToClaim')"
      :error="!normalizedUrl"
    />

    <BtnMain
      :disabled="!normalizedUrl || !isTippingSupported"
      extend
      @click="claimTips"
    >
      {{ $t('common.confirm') }}
    </BtnMain>

    <Loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  onMounted,
} from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  BLOG_CLAIM_TIP_URL,
  MODAL_CLAIM_SUCCESS,
  aettosToAe,
  toURL,
  validateTipUrl,
} from '../utils';
import { IS_EXTENSION } from '../../lib/environment';
import {
  useAccounts,
  useModals,
  useSdk13,
  useTippingContracts,
} from '../../composables';
import { ROUTE_ACCOUNT } from '../router/routeNames';
import InputField from '../components/InputField.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import BtnHelp from '../components/buttons/BtnHelp.vue';
import AccountInfo from '../components/AccountInfo.vue';

export default defineComponent({
  name: 'TipsClaim',
  components: {
    InputField,
    BtnMain,
    BtnHelp,
    AccountInfo,
  },
  setup() {
    const { t } = useI18n();
    const store = useStore();
    const router = useRouter();

    const { isTippingSupported } = useSdk13({ store });
    const { activeAccount } = useAccounts({ store });
    const { openModal, openDefaultModal } = useModals();
    const { getTippingContracts } = useTippingContracts({ store });

    const tipUrl = ref('');
    const loading = ref(false);

    const normalizedUrl = computed(
      () => validateTipUrl(tipUrl.value) ? toURL(tipUrl.value).toString() : '',
    );

    async function claimTips() {
      const url = normalizedUrl.value;
      loading.value = true;
      try {
        const { tippingV1 } = await getTippingContracts();
        const claimAmount = parseFloat(
          aettosToAe(
            await tippingV1.unclaimed_for_url(url)
              .then((r) => r.decodedResult)
              .catch(() => 1),
          ),
        );
        if (!claimAmount) {
          throw new Error('NO_ZERO_AMOUNT_PAYOUT');
        }
        await store.dispatch('claimTips', { url, address: activeAccount.value.address });
        await Promise.all([
          store.dispatch('cacheInvalidateOracle'),
          store.dispatch('cacheInvalidateTips'),
        ]);

        openModal(MODAL_CLAIM_SUCCESS, { url, claimAmount });

        router.push({ name: ROUTE_ACCOUNT });
      } catch (error: any) {
        const { error: errorMessage = '' } = error.response ? error.response.data : {};
        let msg;
        if (errorMessage.includes('MORE_ORACLES_NEEDED')) {
          msg = t('pages.claim.moreOracles');
        } else if (errorMessage.includes('URL_NOT_EXISTING')) {
          msg = t('pages.claim.urlNotExisting');
        } else if (
          errorMessage.includes('NO_ZERO_AMOUNT_PAYOUT')
          || error.message.includes('NO_ZERO_AMOUNT_PAYOUT')
        ) {
          msg = t('pages.claim.noZeroClaim');
        } else if (errorMessage.includes('ORACLE_SERVICE_CHECK_CLAIM_FAILED')) {
          msg = t('pages.claim.oracleFailed');
        } else if (errorMessage) {
          msg = errorMessage;
        }
        if (msg) {
          openDefaultModal({ msg });
        } else {
          error.payload = { url };
          throw error;
        }
      } finally {
        loading.value = false;
      }
    }

    onMounted(async () => {
      if (IS_EXTENSION && browser) {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (tab?.url && validateTipUrl(tab.url)) {
          tipUrl.value = tab.url;
        }
      }
    });

    return {
      activeAccount,
      claimTips,
      loading,
      normalizedUrl,
      tipUrl,
      isTippingSupported,
      BLOG_CLAIM_TIP_URL,
    };
  },
});
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
