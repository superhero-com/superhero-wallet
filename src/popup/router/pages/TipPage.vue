<template>
  <div class="popup ">
    <div>
        <p class="primary-title text-left mb-8 f-16" v-if="!confirmMode">
          {{ $t('pages.tipPage.heading') }} 
          <span class="secondary-text"> {{ $t('pages.appVUE.aeid') }} </span> 
          {{ $t('pages.tipPage.to') }} 
        </p>
        <p class="primary-title text-left mb-8 f-16" v-if="confirmMode">
            {{ $t('pages.tipPage.headingSending') }} 
            <span class="secondary-text">{{ finalAmount }} {{ $t('pages.appVUE.aeid') }} </span> 
            {{ $t('pages.tipPage.to') }}
            (0.30 USD) to
        </p>
        <a class="link-sm text-left block">{{ tipUrl }}</a>
        <div class="flex flex-justify-between flex-align-start mt-25" v-if="!confirmMode">
          <Input class="amount-box" type="number" :error="validAmount ? false : true" v-model="finalAmount" :placeholder="$t('pages.tipPage.amountPlaceholder')" :label="$t('pages.tipPage.amountLabel')"/>
          <div class="ml-15 text-left" style="margin-right:auto">
            <p class="label hidden">Empty</p>
            <span class="secondary-text f-14 block l-1"> {{ tokenSymbol }}</span>
            <span class="f-14 block l-1">60 USD</span>
          </div>
          <div class="balance-box">
            <p class="label">{{ $t('pages.tipPage.availableLabel') }}</p>
            <span class="secondary-text f-14 block l-1">{{ roundedAmount }} {{ tokenSymbol }}</span>
            <span class="f-14 block l-1">60 USD</span>
          </div>
        </div>

        <Textarea v-model="note" :placeholder="$t('pages.tipPage.titlePlaceholder')" size="sm" v-if="!confirmMode"/>
        <div class="tip-note-preview" v-if="confirmMode">
          {{ note }}
        </div>
        <Button @click="toConfirm" :disabled="note && validAmount && tipping ? false: true" v-if="!confirmMode">
          {{ $t('pages.tipPage.next') }}
        </Button>
        <Button @click="sendTip"  v-if="confirmMode">
          {{ $t('pages.tipPage.confirm') }}
        </Button>
        <Button @click="confirmMode = false" v-if="confirmMode">
          {{ $t('pages.tipPage.edit') }}
        </Button>
      </div>
    <popup :popupSecondBtnClick="popup.secondBtnClick"></popup>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { setInterval, setTimeout, setImmediate, clearInterval } from 'timers';
import BigNumber from 'bignumber.js';
import { extractHostName, convertToAE } from '../../utils/helper';
import { MAGNITUDE, MIN_SPEND_TX_FEE, MIN_SPEND_TX_FEE_MICRO, TIPPING_CONTRACT, toMicro } from '../../utils/constants';

export default {
  data() {
    return {
      domain: '',
      favicon: undefined,
      title: '',
      url: '',
      tipUrl: false,
      loadFavicon: true,
      domainVerified: true,
      selectedTip: null,
      finalAmount: null,
      txFee: MIN_SPEND_TX_FEE,
      tipDomain: false,
      note: undefined,
      domainDataInterval: null,
      websiteTips: undefined,
      confirmMode: false
    };
  },
  computed: {
    ...mapGetters(['balance', 'account', 'tokenSymbol', 'tokenBalance', 'popup', 'network', 'tipping', 'current', 'tippingReceiver']),
    maxValue() {
      const calculatedMaxValue = this.balance - MIN_SPEND_TX_FEE;
      return calculatedMaxValue > 0 ? calculatedMaxValue.toString() : 0;
    },
    validAmount(){
      return this.finalAmount && !isNaN(this.finalAmount) && this.maxValue - this.finalAmount > 0 && this.finalAmount > 0
    },
    roundedAmount() {
      return this.tokenBalance.toFixed(3);
    }
  },
  created() {
    this.getDomainData();
    this.domainDataInterval = setInterval(() => {
      this.getDomainData();
    }, 5000);
  },
  methods: {
    getDomainData() {
      browser.tabs.query({ active: true, currentWindow: true }).then(async tabs => {
        const currentTabUrl = tabs[0].url;
        this.favicon = tabs[0].favIconUrl;
        this.title = tabs[0].title;
        this.url = tabs[0].url;
        if (!this.tipUrl) {
          this.tipUrl = this.url;
        }
        await this.tipWebsiteType();

        setTimeout(() => {
          this.loadFavicon = false;
        }, 1500);
      });
    },
    navigateUtilities() {
      this.$router.push('/account');
    },
    checkDomain() {
      this.domainVerified = true;
    },
    toConfirm() {
      this.confirmMode = true
    },
    sendTip() {
      let amount = this.finalAmount;
      if (this.maxValue - amount <= 0 || isNaN(amount) || amount <= 0) {
        this.$store.dispatch('popupAlert', { name: 'spend', type: 'insufficient_balance' });
        return;
      }
      if (!this.note || !this.domain) {
        this.$store.dispatch('popupAlert', { name: 'account', type: 'requiredField' });
        return;
      }

      amount = BigNumber(amount).shiftedBy(MAGNITUDE);
      this.confirmTip(this.tipUrl, amount, this.note);
    },
    async confirmTip(domain, amount, note) {
      try {
        this.loading = true
        const res = await this.tipping.call('tip',[domain,note],{ amount, waitMined: false })
        if(res.hash) {
          browser.storage.local.set({ pendingTip:{hash: res.hash, amount: this.finalAmount, domain: domain, time: new Date().toLocaleTimeString()} }).then(() => { });
          this.loading = false
          this.$store.commit('SET_AEPP_POPUP', false);
          return this.$router.push({
            name: 'account'
          });
        }
      } catch(e) {
        console.log(e)
        this.loading = false
        return this.$store.dispatch('popupAlert', { name: 'spend', type: 'transaction_failed' });
      }
    },
    async tipWebsiteType() {
      if (this.tipDomain) {
        this.domain = extractHostName(this.url);
      } else {
        this.domain = this.url;
      }
    },
  },
  beforeDestroy() {
    clearInterval(this.domainDataInterval);
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.actions {
  width: 50%;
  margin-top: 5px;
}

.tipWebsiteHeader {
  margin-bottom: 20px;
}
.ae-divider {
  background-color: #bbbbbb !important;
}
.domainFavicon {
  width: 32px;
  margin-right: 15px;
}
.noFavicon {
  font-size: 0.8rem;
  height: 32px;
  word-break: break-word;
}
.domainInfo {
  flex-grow: 1;
  h3 {
    // font-size:1.5rem;
    margin: 0;
    word-break: break-word;
    text-overflow: ellipsis;
    overflow: hidden;
    width: 220px;
    white-space: nowrap;
  }
  .domain {
    position: relative;
    cursor: pointer;
  }
  .domain:hover .full-domain {
    display: block;
  }
  .full-domain {
    display: none;
    position: absolute;
    left: 0;
    right: 0;
    top: 115%;
    background: #001833;
    color: #fff;
    padding: 5px;
    border-radius: 6px;
    word-break: break-word;
    white-space: normal;
    z-index: 15;
    font-size: 0.8rem;
  }
  .full-domain:after {
    content: '';
    border: solid black;
    border-width: 0 3px 3px 0;
    display: inline-block;
    padding: 3px;
    transform: rotate(-135deg);
    -webkit-transform: rotate(-135deg);
    -ms-transform: rotate(-135deg);
    position: absolute;
    top: -4px;
    left: 23px;
    background: inherit;
  }
  h6 {
    margin: 0;
    word-break: break-word;
  }
  p {
    margin: 0;
    font-weight: normal;
  }
  .ae-icon {
    color: #fff !important;
    width: 20px !important;
    height: 20px !important;
    font-size: 0.8rem;
    margin-right: 2px;
    border: 2px solid #dae1ea;
  }
  .verifyRow {
    display: inline-block;
    font-size: 1rem;
  }
  .verified {
    color: $color-alternative;
  }
  .notVerified {
    color: $primary-color;
    .ae-icon {
      background: $primary-color !important;
    }
  }
  .verifyBtn {
    color: $color-alternative;
    float: right;
    font-size: 1rem;
    cursor: pointer;
  }
}
.balance {
  color: $color-alternative;
  font-weight: bold;
}
.claimTips {
  margin-top: 10px;
  button.disabled {
    opacity: 0.5;
  }
}
.textarea {
  min-height: 60px;
}
.tipWebisteAmount {
  margin-bottom: 25px;
  .ae-badge {
    border-radius: 20px;
    width: 20%;
    justify-content: center;
    cursor: pointer;
    background: #e4e4e4;
  }
  .ae-badge.primary {
    background: $primary-color;
    color: #fff;
  }
  .ae-badge.alternative {
    background: $color-alternative;
    color: #fff;
  }
}
.sendTip {
  margin-top: 25px;
}
.tipSlider {
  margin: 25px 0;
}
.hideSlider {
  opacity: 0.3;
}
.amount-container {
  position: relative;
}
.hideSlider .sliderOver {
  position: absolute;
  z-index: 50;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
}
.balanceInfo {
  margin-top: 15px;
}
.btn-50 {
  width: 50%;
}
.ae-address {
  font-weight: bold !important;
  color: #000;
}
.tabs {
  margin-top: 1rem;
}
.tabs span {
  width: 49%;
}
.claim-info {
  margin-top: 20px;
  .balance {
    font-weight: bold;
    font-size: 3rem;
    color: #000;
  }
  .balance:after {
    font-size: 1.5rem;
    content: 'AE';
  }
  small {
    font-size: 0.8rem;
  }
}
.tip-content {
  width: 60%;
}
</style>
