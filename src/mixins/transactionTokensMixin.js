import { mapState, mapGetters } from 'vuex';
import { camelCase } from 'lodash-es';
import { FUNCTION_TYPE_DEX, MAGNITUDE } from '../popup/utils/constants';
import { amountRounded, convertToken } from '../popup/utils/helper';
import * as TransactionResolver from '../popup/utils/transactionTokenInfoResolvers';

export default {
  computed: {
    ...mapState('fungibleTokens', ['availableTokens']),
    ...mapGetters([
      'getTxAmountTotal',
      'getTxSymbol',
      'getTxType',
      'getTxDirection',
      'account',
      'getDexContracts',
    ]),
    txType() {
      return this.getTxType(this.transaction);
    },
    tokens() {
      const resolver = TransactionResolver[camelCase(this.transaction?.tx?.function)];
      if (resolver && (!this.isAllowance || this.showDetailedAllowanceInfo)) {
        return resolver(this.transaction, this.availableTokens).tokens;
      }
      return [{
        ...this.transaction.tx,
        amount: this.isAllowance
          ? convertToken(this.transaction.tx.fee, -MAGNITUDE)
          : this.getTxAmountTotal(this.transaction),
        symbol: this.isAllowance ? 'AE' : this.getTxSymbol(this.transaction),
        isReceived: this.getTxDirection(this.transaction) === 'received',
        isAe: this.isAllowance || this.getTxSymbol(this.transaction) === 'AE',
      }];
    },
    isErrorTransaction() {
      return this.transaction?.tx?.returnType && this.transaction.tx.returnType !== 'ok';
    },
    isAllowance() {
      return FUNCTION_TYPE_DEX.allowance.includes(this.transaction.tx?.function)
        && this.availableTokens[this.transaction.tx?.contractId];
    },
    isDex() {
      return TransactionResolver[camelCase(this.transaction.tx.function)]
      && (this.getDexContracts.router.includes(this.transaction?.tx?.contractId)
        || this.getDexContracts.wae.includes(this.transaction?.tx?.contractId));
    },
  },
  methods: {
    convertToken,
    amountRounded,
  },
};
