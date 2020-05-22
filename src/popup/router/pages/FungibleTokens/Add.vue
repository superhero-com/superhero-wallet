<template>
  <div>
    <div class="popup">
      <div v-if="step === 'search' || step === 'confirm'">
        <Input
          :label="$t('pages.add-fungible-token.contract-label')"
          :disabled="step === 'confirm'"
          v-model="token.contract"
          :error="!validContract"
        />

        <Input
          v-if="token.symbol"
          :label="$t('pages.add-fungible-token.symbol-label')"
          :disabled="step === 'confirm'"
          v-model="token.symbol"
        />

        <Input
          v-if="token.symbol && token.decimals"
          :label="$t('pages.add-fungible-token.decimals-label')"
          :disabled="step === 'confirm'"
          v-model="token.decimals"
        />

        <Button @click="next" extend :disabled="exist || !validContract">
          {{ $t('pages.add-fungible-token.next') }}
        </Button>
      </div>

      <div v-else-if="step === 'add'">
        <div class="token-add-holder">
          <div>
            <div class="token-title">{{ $t('pages.add-fungible-token.token') }}</div>
            <div>
              <UserAvatar :address="token.contract" identicon />
              <div>{{ token.symbol }}</div>
            </div>
          </div>
          <div>
            <div class="token-title">{{ $t('pages.add-fungible-token.balance') }}</div>
            <div>{{ tokenBalance }} {{ token.symbol }}</div>
          </div>
        </div>
        <Button @click="addToken" extend>
          {{ $t('pages.add-fungible-token.add') }}
        </Button>
      </div>
    </div>
    <Loader size="big" :loading="loading" type="transparent" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as aeternityTokens from 'aeternity-tokens';
import { validateAddress } from '../../../utils/helper';
import Input from '../../components/Input';
import Button from '../../components/Button';
import UserAvatar from '../../components/UserAvatar';

const initialToken = {
  contract: '',
  symbol: '',
  decimals: 1,
  balance: 0,
  name: '',
};
export default {
  components: { Input, Button, UserAvatar },
  data() {
    return {
      token: { ...initialToken },
      step: 'search',
      loading: false,
    };
  },
  computed: {
    ...mapGetters('tokens', ['owned']),
    ...mapGetters(['sdk', 'account']),
    tokenBalance() {
      return (this.token.balance / ( 10 ** this.token.decimals) ).toFixed(3);
    },
    validContract() {
      return validateAddress(this.token.contract, 'ct');
    },
    exist() {
      const token = this.$store.getters['tokens/find'](this.token.contract);
      return !!token;
    },
  },
  async created() {
    await this.$watchUntilTruly(() => this.sdk);
  },
  methods: {
    async next() {
      if (this.exist) return;
      try {
        const instance = await this.sdk.getContractInstance(aeternityTokens.newToken(), {
          contractAddress: this.token.contract,
        });
        if (this.step === 'search') {
          const {
            decodedResult: { decimals, name, symbol },
          } = await instance.methods.meta_info();
          const { decodedResult: extensions } = await instance.methods.aex9_extensions();
          this.token = { ...this.token, decimals, name, symbol, extensions };
          this.loading = false;
          this.step = 'confirm';
          return;
        }
        this.loading = true;

        const { decodedResult: balance } = await instance.methods.balance(this.account.publicKey);
        this.loading = false;
        this.token.balance = balance || 0;
        this.step = 'add';
      } catch (e) {
        this.$store.dispatch('modals/open', {
          name: 'default',
          title: 'Something went wrong',
          msg: e.message,
        });
      }
    },
    async addToken() {
      await this.$store.dispatch('tokens/add', this.token);
      await this.$store.dispatch('modals/open', {
        name: 'default',
        ...this.$t('modals.add-token'),
      });
      this.loading = false;
      this.token = { ...initialToken };
      this.step = 'search';
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../../common/variables';

.token-title {
  font-size: 1.1rem;
  text-align: left;
  margin-bottom: 1rem;
}

.token-add-holder {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;

  & > div:first-child {
    width: 60%;
  }

  & > div:last-child {
    width: 40%;
  }

  & > div div {
    text-align: left;
    color: $text-color;
    display: flex;
    align-items: center;
  }
}
</style>
