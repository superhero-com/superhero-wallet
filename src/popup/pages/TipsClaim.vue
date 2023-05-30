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

<script>
import { mapGetters, mapState, useStore } from 'vuex';
import {
  BLOG_CLAIM_TIP_URL,
  MODAL_CLAIM_SUCCESS,
  aettosToAe,
  toURL,
  validateTipUrl,
  watchUntilTruthy,
} from '../utils';
import { IS_EXTENSION } from '../../lib/environment';
import { useAccounts, useModals } from '../../composables';
import { ROUTE_ACCOUNT } from '../router/routeNames';
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
    const { activeAccount } = useAccounts({ store });

    return {
      activeAccount,
    };
  },
  data: () => ({
    url: '',
    loading: false,
    BLOG_CLAIM_TIP_URL,
  }),
  computed: {
    ...mapState(['tippingV1']),
    ...mapGetters('sdkPlugin', ['sdk']),
    ...mapGetters(['tippingSupported']),
    normalizedUrl() {
      if (!validateTipUrl(this.url)) return '';
      return toURL(this.url).toString();
    },
  },
  async mounted() {
    if (IS_EXTENSION) {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab && validateTipUrl(tab.url)) {
        this.url = tab.url;
      }
    }
  },
  methods: {
    async claimTips() {
      const { openModal, openDefaultModal } = useModals();
      const { activeAccount } = useAccounts({ store });

      const url = this.normalizedUrl;
      this.loading = true;
      await watchUntilTruthy(() => this.sdk && this.tippingV1);
      try {
        const claimAmount = parseFloat(
          aettosToAe(
            await this.tippingV1.methods
              .unclaimed_for_url(url)
              .then((r) => r.decodedResult)
              .catch(() => 1),
          ),
        );
        if (!claimAmount) {
          throw new Error('NO_ZERO_AMOUNT_PAYOUT');
        }
        await store.dispatch('claimTips', { url, address: activeAccount.value.address });
        await store.dispatch('cacheInvalidateOracle');
        await store.dispatch('cacheInvalidateTips');

        openModal(MODAL_CLAIM_SUCCESS, { url, claimAmount });

        this.$router.push({ name: ROUTE_ACCOUNT });
      } catch (e) {
        const { error = '' } = e.response ? e.response.data : {};
        let msg;
        if (error.includes('MORE_ORACLES_NEEDED')) msg = this.$t('pages.claim.moreOracles');
        else if (error.includes('URL_NOT_EXISTING')) msg = this.$t('pages.claim.urlNotExisting');
        else if (
          error.includes('NO_ZERO_AMOUNT_PAYOUT')
          || e.message.includes('NO_ZERO_AMOUNT_PAYOUT')
        ) msg = this.$t('pages.claim.noZeroClaim');
        else if (error.includes('ORACLE_SEVICE_CHECK_CLAIM_FAILED')) msg = this.$t('pages.claim.oracleFailed');
        else if (error) msg = error;
        if (msg) {
          openDefaultModal({ msg });
        } else {
          e.payload = { url };
          throw e;
        }
      } finally {
        this.loading = false;
      }
    },
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
