<template>
  <Button
    :disabled="selectedToken ? !tippingV2 : !tippingV1"
    new-ui
  >
    <slot />
    {{ $t('pages.send.send') }}
  </Button>
</template>

<script>
import { SCHEMA } from '@aeternity/aepp-sdk';
import { mapState } from 'vuex';
import Button from './Button.vue';
import { aeToAettos, convertToken, escapeSpecialChars } from '../../utils/helper';

export default {
  components: { Button },
  props: {
    amount: { type: String, required: true },
    selectedToken: { type: [Object, String], default: 'AE' },
    tipUrl: { type: String, default: null },
  },
  computed: {
    ...mapState(['tippingV1', 'tippingV2']),
  },
  methods: {
    async sendTip() {
      const amount = aeToAettos(this.amount);
      this.loading = true;
      try {
        let txResult = null;

        if (this.selectedToken) {
          await this.$store.dispatch('fungibleTokens/createOrChangeAllowance', this.amount);
          txResult = await this.tippingV2.methods.tip_token(
            this.url,
            escapeSpecialChars(this.note),
            this.selectedToken.contractId,
            convertToken(this.amount, this.selectedToken.decimals).toFixed(),
          );

          await this.$store.dispatch('fungibleTokens/loadTokenBalances');
          this.$store.commit(
            'fungibleTokens/setSelectedToken',
            this.tokenBalances.find(({ value }) => value === this.selectedToken.value),
          );
        } else {
          txResult = await this.tippingContract.call(
            'tip',
            [this.url, escapeSpecialChars(this.note)],
            {
              amount,
              waitMined: false,
              modal: false,
            },
          );
        }

        this.$store.dispatch('addPendingTransaction', {
          hash: txResult.hash,
          amount: this.selectedToken ? this.amount : amount,
          tipUrl: this.url,
          tx: {
            callerId: this.account.address,
            contractId: this.tippingContract.deployInfo.address,
            type: SCHEMA.TX_TYPE.contractCall,
            function: 'tip',
          },
        });
        this.openCallbackOrGoHome(true);
      } catch (e) {
        await this.$store.dispatch('modals/open', {
          name: 'default',
          title: this.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        e.payload = { url: this.url };
        throw e;
      } finally {
        this.loading = false;
        if (this.tipFromPopup) window.close();
      }
    },
  },
};
</script>
