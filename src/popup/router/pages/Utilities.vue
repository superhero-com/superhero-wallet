<template>
    <div class="popup">
        <div class="actions">
            <button class="backbutton toAccount" @click="navigateAccount"><ae-icon name="back" /> {{$t('pages.utilities.backToAccount')}}</button>
        </div>
        <h3 style='text-align:center;'>{{$t('pages.utilities.heading')}}</h3>
        <br>
        <ae-list id="utilitiesPage" class="settingslist" face="primary">
            <button class="aens-page" @click="openNamingSystemPage">
                <span class="settings-li">{{$t('pages.utilities.namingSystem')}}</span>
                <i class="arrowright"></i>
                <p class="tabinfo">{{$t('pages.utilities.namingSystemInfo')}}</p>
            </button>
            <button class="generalsett" @click="openTipPage">
                <span class="settings-li">{{$t('pages.utilities.tipWebsite')}}</span>
                <i class="arrowright"></i>
                <p class="tabinfo">{{$t('pages.utilities.tipWebsiteInfo')}}</p>
            </button>
            <button class="fungible-tokens" @click="openFungibleTokensPage">
                <span class="settings-li">{{$t('pages.utilities.fungibleTokens')}}</span>
                <i class="arrowright"></i>
                <p class="tabinfo">{{$t('pages.utilities.fungibleTokensInfo')}}</p>
            </button>
            <button class="sign-verify-messages" @click="openSignVerifyMsgPage">
                <span class="settings-li">{{$t('pages.utilities.signAndVerifyMsg')}}</span>
                <i class="arrowright"></i>
                <p class="tabinfo">{{$t('pages.utilities.signAndVerifyMsgInfo')}}</p>
            </button>
            <button class="sign-verify-messages" @click="openTokenMigration">
                <span class="settings-li">{{$t('pages.utilities.tokenMigration')}}</span>
                <i class="arrowright"></i>
                <p class="tabinfo">{{$t('pages.utilities.prepareTokenMigration')}}</p>
            </button>
        </ae-list>
        <Loader size="big" :loading="loading" type="transparent" ></Loader>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import QrcodeVue from 'qrcode.vue';
import Wallet from '@aeternity/aepp-sdk/es/ae/wallet';
import { MemoryAccount } from '@aeternity/aepp-sdk';
import { MAGNITUDE, MIN_SPEND_TX_FEE, MIN_SPEND_TX_FEE_MICRO } from '../../utils/constants';
import BigNumber from 'bignumber.js';
import Ae from '@aeternity/aepp-sdk/es/ae/universal';
import { FUNGIBLE_TOKEN_CONTRACT } from '../../utils/constants';
import * as Crypto from '@aeternity/aepp-sdk/es/utils/crypto'
import { addressGenerator } from '../../utils/address-generator';

export default {
  data() {
    return {
      loading: false,
    }
  },
  computed: {
    ...mapGetters(['account', 'balance', 'network', 'current', 'wallet', 'activeAccount', 'subaccounts', 'tokenSymbol', 'tokenBalance', 'sdk', 'tokens', 'popup', 'tokenRegistry']),
  },
  methods: {
    openTipPage() {
      this.$router.push('/tip');
    },
    navigateAccount() {
      this.$router.push('/account');
    },
    openFungibleTokensPage() {
      this.$router.push('/fungible-tokens');
    },
    openSignVerifyMsgPage() {
      this.$router.push('/signAndVerifyMsg');
    },
    openNamingSystemPage() {
      this.$router.push('/aens');
    },
    openTokenMigration() {
      this.$router.push('/token-migration-info')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';

</style>