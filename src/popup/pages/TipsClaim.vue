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
import {
  defineComponent,
  computed,
  ref,
  onMounted,
} from '@vue/composition-api';
import {
  BLOG_CLAIM_TIP_URL,
  MODAL_CLAIM_SUCCESS,
  aettosToAe,
  toURL,
  validateTipUrl,
} from '../utils';
import { IS_EXTENSION } from '../../lib/environment';
import { useAccounts, useModals, useTippingContracts } from '../../composables';
import { ROUTE_ACCOUNT } from '../router/routeNames';
import InputField from '../components/InputField.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import BtnHelp from '../components/buttons/BtnHelp.vue';
import AccountInfo from '../components/AccountInfo.vue';

export default defineComponent({
  components: {
    InputField,
    BtnMain,
    BtnHelp,
    AccountInfo,
  },
  setup(props, { root }) {
    const { activeAccount } = useAccounts({ store: root.$store });
    const { openModal, openDefaultModal } = useModals();
    const { getTippingContracts } = useTippingContracts({ store: root.$store });

    const tipUrl = ref('');
    const loading = ref(false);
    const tippingSupported = computed(() => root.$store.getters.tippingSupported);

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
        await root.$store.dispatch('claimTips', { url, address: activeAccount.value.address });
        await root.$store.dispatch('cacheInvalidateOracle');
        await root.$store.dispatch('cacheInvalidateTips');

        openModal(MODAL_CLAIM_SUCCESS, { url, claimAmount });

        root.$router.push({ name: ROUTE_ACCOUNT });
      } catch (error: any) {
        const { error: errorMessage = '' } = error.response ? error.response.data : {};
        let msg;
        if (errorMessage.includes('MORE_ORACLES_NEEDED')) {
          msg = root.$t('pages.claim.moreOracles');
        } else if (errorMessage.includes('URL_NOT_EXISTING')) {
          msg = root.$t('pages.claim.urlNotExisting');
        } else if (
          errorMessage.includes('NO_ZERO_AMOUNT_PAYOUT')
          || error.message.includes('NO_ZERO_AMOUNT_PAYOUT')
        ) {
          msg = root.$t('pages.claim.noZeroClaim');
        } else if (errorMessage.includes('ORACLE_SEVICE_CHECK_CLAIM_FAILED')) {
          msg = root.$t('pages.claim.oracleFailed');
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
        if (tab && validateTipUrl(tab.url)) {
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
      tippingSupported,
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

      ::v-deep .icon {
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
