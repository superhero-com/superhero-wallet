import { STUB_ACCOUNT } from '@/constants/stubs';
import { formatDate, formatTime } from '@/utils';

const { addressAeternity } = STUB_ACCOUNT;
const TIME = 1789513172252;
const TRANSACTION = {
  hash: 'th_26iZQ1pXFevyyytFCM9MMFwu1otqW9yHmHgpUFU9evR2r8MV9A',
  block_hash: 'mh_wHszo4QNgYqGW7TgaoHAVytNsvdAEQ9weZUoCN98WA6MXGQhc',
  block_height: 1293234,
  micro_time: TIME,
  tx: {
    amount: 200000000000000000,
    fee: 16860000000000,
    nonce: 15539,
    payload: 'ba_Xfbg4g==',
    recipient_id: 'ak_wMHNCzQJ4HUL3TZ1fi6nQsHg6TjmHLs1bPXSp8iQ1VmxGNAZ4',
    sender_id: addressAeternity,
    type: 'SpendTx',
    version: 1,
  },
};

/** Ignores spaces: the hash is split in groups, amounts and symbols are separate elements. */
function shouldShow(item, text) {
  const withoutSpaces = (value) => `${value}`.replace(/\s/g, '');
  cy.get(`[data-cy=${item}]`)
    .should(($item) => expect(withoutSpaces($item.text())).to.contain(withoutSpaces(text)));
}

function checkDetails() {
  shouldShow('hash', TRANSACTION.hash);
  shouldShow('block-height', TRANSACTION.block_height);
  shouldShow('nonce', TRANSACTION.tx.nonce);
  shouldShow('amount', '0.20 AE');
  shouldShow('fee', '0.00001686 AE');
  shouldShow('total', '0.20001686 AE');
  shouldShow('timestamp', `${formatDate(TIME)} ${formatTime(TIME)}`);
}

describe('Tests cases for transaction details page', () => {
  it('shows a transaction opened from the list', () => {
    cy.intercept({ method: 'GET', url: /\/accounts\/ak_\w+\/activities\?limit=/ }, {
      data: [{ type: 'SpendTxEvent', block_time: TIME, payload: TRANSACTION }],
      next: null,
    });
    cy.login()
      .get('.transaction-item')
      .first()
      .click()
      .location('pathname')
      .should('eq', `/account-details/transactions/${TRANSACTION.hash}/${addressAeternity}`);
    checkDetails();
  });

  it('shows a transaction opened by its link', () => {
    cy.intercept({ method: 'GET', url: new RegExp(`/v3/transactions/${TRANSACTION.hash}$`) }, TRANSACTION);
    cy.login({}, `/account-details/transactions/${TRANSACTION.hash}/${addressAeternity}`);
    checkDetails();
  });
});
