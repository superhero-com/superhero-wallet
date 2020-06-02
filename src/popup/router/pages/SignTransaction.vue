<template>
  <div class="popup">
    <ae-list class="spendTxDetailsList">
      <ae-list-item fill="neutral" class="flex-justify-between whiteBg noBorder">
        <div class="flex flex-align-center accountFrom">
          <UserAvatar :address="account.publicKey" :name="account.name" />
          <span class="spendAccountAddr">{{ activeAccountName }}</span>
        </div>
        <div class="arrowSeprator">
          <ae-icon name="left-more" />
        </div>
        <div class="flex flex-align-center accountTo">
          <ae-icon name="square" />
          <span class="spendAccountAddr">{{
            data.type == 'contractCreate'
              ? $t('pages.signTransaction.newContract')
              : $t('pages.signTransaction.aens')
          }}</span>
        </div>
      </ae-list-item>
      <ae-list-item
        fill="neutral"
        class="flex-justify-between flex-align-start flex-direction-column"
      >
        <div>
          <ae-badge>{{ txType }}</ae-badge>
        </div>
      </ae-list-item>
      <ae-list-item
        v-if="data.type == 'nameClaim' || data.type == 'nameUpdate'"
        fill="neutral"
        class="flex-justify-between whiteBg  flex-align-center "
      >
        <div class="tx-label">
          {{ $t('pages.signTransaction.name') }}
        </div>
        <div>
          <strong>{{ data.tx.name }}</strong>
        </div>
      </ae-list-item>
      <ae-list-item
        v-if="data.type == 'nameClaim'"
        fill="neutral"
        class="flex-justify-between whiteBg flex-align-center "
      >
        <div class="tx-label ">
          {{ $t('pages.signTransaction.nameSalt') }}
        </div>
        <div>
          <strong>{{ data.tx.preclaim.salt }}</strong>
        </div>
      </ae-list-item>
      <ae-list-item
        v-if="data.type == 'nameUpdate'"
        fill="neutral"
        class="flex-justify-between whiteBg  flex-align-center flex-direction-column"
      >
        <div class="tx-label extend text-left">
          {{ $t('pages.signTransaction.nameId') }}
        </div>
        <div class="text-left">
          <strong>{{ data.tx.claim.id }}</strong>
        </div>
      </ae-list-item>
      <ae-list-item
        fill="neutral"
        class="flex-justify-between whiteBg flex-direction-column flex-align-center "
        v-if="alertMsg == ''"
      >
        <div class="flex extend flex-justify-between flex-align-center">
          <div>{{ $t('pages.signTransaction.fee') }}</div>
          <div class="text-right">
            <div class="balance balanceBig txFee">{{ selectedFee }}</div>
          </div>
        </div>
      </ae-list-item>
    </ae-list>
    <div class="btnFixed">
      <Button half @click="cancelTransaction">{{ $t('pages.signTransaction.reject') }}</Button>
      <Button half @click="signTransaction" class="confirm" :disabled="signDisabled">{{
        $t('pages.signTransaction.confirm')
      }}</Button>
    </div>
    <Loader size="big" :loading="loading" type="transparent" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';
import { MAGNITUDE, TX_TYPES, calculateFee } from '../../utils/constants';
import Button from '../components/Button';
import UserAvatar from '../components/UserAvatar';

export default {
  components: {
    Button,
    UserAvatar,
  },
  data() {
    return {
      txFee: {
        min: 0,
        max: 0,
      },
      signDisabled: true,
      alertMsg: '',
      loading: false,
      selectedFee: 0,
      txParams: {},
    };
  },
  props: ['data'],
  async created() {
    this.init();
  },

  computed: {
    ...mapGetters(['account', 'activeAccountName', 'balance', 'sdk']),
    maxValue() {
      const calculatedMaxValue = this.balance - this.fee;
      return calculatedMaxValue > 0 ? calculatedMaxValue.toString() : 0;
    },
    amount() {
      return typeof this.data.tx.amount !== 'undefined' ? this.data.tx.amount : 0;
    },
    fee() {
      return this.txFee.min;
    },
    insufficientBalance() {
      return this.maxValue - this.amount <= 0;
    },
    watchBalance() {
      return this.balance;
    },
    txType() {
      return this.$t('transaction.type')[this.data.tx.type];
    },
    convertSelectedFee() {
      return BigNumber(this.selectedFee).shiftedBy(MAGNITUDE);
    },
  },
  watch: {
    watchBalance() {
      this.showAlert(true);
    },
  },
  methods: {
    async init() {
      if (this.data.tx.options && this.data.tx.options.amount) {
        this.data.tx.amount = this.data.tx.options.amount;
      }

      await this.$watchUntilTruly(() => this.sdk);

      this.txParams = {
        ...this.sdk.Ae.defaults,
      };
      if (this.data.type === 'namePreClaim') {
        this.txParams = {
          ...this.txParams,
          accountId: this.account.publicKey,
          commitmentId: 'cm_PtSWNMMNJ187NzGgivLFpYKptevuFQx1rKdqsDFAKVkXtyjPJ',
        };
      } else if (this.data.type === 'nameClaim') {
        this.txParams = {
          ...this.txParams,
          accountId: this.account.publicKey,
          name: 'nm_2Wb2xdC9WMSnExyHd8aoDu2Ee8qHD94nvsFQsyiy1iEyUGPQp9',
          nameSalt: this.data.tx.preclaim.salt,
        };
      } else if (this.data.type === 'nameBid') {
        this.txParams = {
          ...this.txParams,
          accountId: this.account.publicKey,
          name: 'nm_2Wb2xdC9WMSnExyHd8aoDu2Ee8qHD94nvsFQsyiy1iEyUGPQp9',
          nameSalt: 0,
        };
      } else if (this.data.type === 'nameUpdate') {
        this.txParams = {
          ...this.txParams,
          accountId: this.account.publicKey,
          nameId: this.data.tx.claim.id,
          pointers: this.data.tx.claim.pointers,
        };
      }
      const fee = calculateFee(TX_TYPES[this.data.type], this.txParams);
      this.txFee = fee;
      this.selectedFee = this.fee.toFixed(7);
      if (this.alertMsg === '') {
        this.signDisabled = false;
      }

      setTimeout(() => {
        this.showAlert();
      }, 3500);
    },
    showAlert(balance = false) {
      if (this.insufficientBalance && this.sdk !== null && !this.loading && balance) {
        this.alertMsg = this.$t('pages.signTransaction.insufficientBalance');
      } else {
        this.alertMsg = '';
      }
      if (this.alertMsg === '') {
        if (this.selectedFee) {
          this.signDisabled = false;
        }
      } else {
        this.signDisabled = true;
      }
    },
    async cancelTransaction() {
      this.$store.commit('SET_AEPP_POPUP', false);
      this.$router.push('/account');
    },
    redirectToTxConfirm(tx) {
      this.$store.commit('SET_AEPP_POPUP', true);

      this.$router.push({
        name: 'sign',
        params: {
          data: tx,
          type: tx.type,
        },
      });
    },
    async namePreclaim() {
      try {
        const preclaim = await this.sdk.aensPreclaim(this.data.tx.name, {
          fee: this.convertSelectedFee,
        });
        this.$store.commit('SET_TX_QUEUE', preclaim.hash);
        const tx = {
          popup: false,
          tx: {
            name: this.data.tx.name,
            recipientId: '',
            preclaim,
            type: 'NameClaimTx',
          },
          type: 'nameClaim',
        };
        this.redirectToTxConfirm(tx);
      } catch (err) {
        this.$store.commit('SET_TX_QUEUE', 'error');
        this.$store.dispatch('modals/open', { name: 'default', msg: err.message });
        this.$store.commit('SET_AEPP_POPUP', false);
        this.$router.push('/names');
      }
    },
    async nameClaim() {
      const { name } = this.data.tx;
      if (this.data.bid) {
        try {
          await this.sdk.aensBid(name, this.data.tx.BigNumberAmount);
        } catch (err) {
          this.$store.commit('SET_TX_QUEUE', 'error');
          this.$store.dispatch('modals/open', { name: 'default', msg: err.message });
        }
      } else {
        try {
          const claim = await this.data.tx.preclaim.claim({
            waitMined: false,
            fee: this.convertSelectedFee,
          });
          this.$store.commit('SET_TX_QUEUE', claim.hash);
          this.$store.commit('SET_AEPP_POPUP', false);
          this.$router.push('/names');

          await this.sdk.poll(claim.hash);
          const { id, pointers } = await this.sdk.getName(name);
          const tx = {
            popup: false,
            tx: {
              name,
              claim: { id, name, pointers },
              pointers: [this.account.publicKey],
            },
            type: 'nameUpdate',
            nameUpdateType: 'updatePointer',
          };
          this.redirectToTxConfirm(tx);
          return;
        } catch (err) {
          let msg = err.message;
          if (msg.includes('is not enough to execute')) {
            msg = this.$t('pages.signTransaction.balanceError');
          }
          this.$store.commit('SET_TX_QUEUE', 'error');
          this.$store.dispatch('modals/open', { name: 'default', msg });
        }
      }
      this.$store.commit('SET_AEPP_POPUP', false);
      this.$router.push('/names');
    },
    async nameUpdate() {
      try {
        const nameObject = await this.sdk.aensQuery(this.data.tx.name);
        let update;
        if (this.data.nameUpdateType === 'extend') {
          update = await nameObject.extendTtl();
        } else if (this.data.nameUpdateType === 'updatePointer') {
          update = await nameObject.update(this.data.tx.pointers, { extendPointers: true });
        }
        this.$store.commit('SET_TX_QUEUE', update.hash);
        await this.$store.dispatch('modals/open', { name: 'default', msg: 'Successfully added!' });
      } catch (err) {
        this.$store.commit('SET_TX_QUEUE', 'error');
        this.$store.dispatch('modals/open', { name: 'default', msg: err.message });
      }
      this.$store.commit('SET_AEPP_POPUP', false);
      this.$router.push('/names');
    },
    async signTransaction() {
      if (!this.signDisabled) {
        this.loading = true;
        try {
          if (this.data.type === 'namePreClaim') {
            this.namePreclaim();
          } else if (this.data.type === 'nameClaim') {
            this.nameClaim();
          } else if (this.data.type === 'nameUpdate') {
            this.nameUpdate();
          } else if (this.data.type === 'nameBid') {
            this.nameClaim();
          }
        } catch (e) {
          console.error(`signTransaction: ${e}`);
        }
      }
    },
  },
  beforeRouteUpdate(to, from, next) {
    next();
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';

.balanceSpend {
  font-size: 2rem;
  color: $white-color;
}

.spendTxDetailsList {
  .balance {
    font-family: Roboto, sans-serif;
    color: $white-color;
  }

  .ae-list-item {
    position: relative;
    cursor: unset;
    // text-transform: uppercase;
    font-size: 0.8rem;

    div .ae-badge {
      background: $accent-color;
      font-family: Roboto, sans-serif;
      color: $white-color;
      -webkit-box-shadow: 0 0 0 2px $accent-color;
      box-shadow: 0 0 0 2px $accent-color;
      border: 2px solid $bg-color;
    }
  }
}

.spendTxDetailsList .ae-button {
  margin-bottom: 0 !important;
}

.arrowSeprator {
  margin-right: 1rem;
  background: $accent-color;
  color: $white-color;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  text-align: center;
  vertical-align: middle;
  border: 1px solid $white-color;
  line-height: 20px;

  .ae-icon {
    font-size: 1.2rem !important;
    float: none !important;
  }

  &::after {
    content: '';
  }
}

.ae-identicon.base {
  border: 0.125rem solid transparent;
  -webkit-box-shadow: 0 0 0 2px $secondary-color;
  box-shadow: 0 0 0 1px $secondary-color;
  width: 2rem;
}

.spendAccountAddr {
  padding: 0 0.5rem !important;
  font-weight: normal !important;
  font-size: 0.8rem !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.noBorder {
  border-top: none !important;
}

.accountFrom {
  width: 40%;
}

.accountTo {
  width: 70%;

  .ae-icon {
    font-size: 2rem;
  }
}

.extend {
  width: 100%;
}

.tx-label {
  margin-top: 0.4rem;
}

.ae-identicon {
  width: auto;
}
</style>
