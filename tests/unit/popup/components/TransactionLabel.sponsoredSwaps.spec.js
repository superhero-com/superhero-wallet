import { enableAutoUnmount, mount } from '@vue/test-utils';

import { useAccounts } from '@/composables/accounts';
import { useAeSdk } from '@/composables/aeSdk';
import { PROTOCOLS } from '@/constants';
import { AE_NETWORK_MAINNET_ID } from '@/protocols/aeternity/config';
import { i18n, tg } from '@/popup/plugins/i18n';
import TransactionLabel from '@/popup/components/TransactionLabel.vue';
import { ACCOUNT, PAYER, sponsoredSwap } from '../../helpers/sponsoredSwap';

function mountLabel(transaction, { active = ACCOUNT, showTransactionOwner = false } = {}) {
  vi.spyOn(useAccounts().activeAccount, 'value', 'get')
    .mockReturnValue({ address: active, protocol: PROTOCOLS.aeternity });
  return mount({
    ...TransactionLabel,
    components: {
      ...TransactionLabel.components,
      WarningIcon: { template: '<span class="warning-icon" />' },
      RevertedIcon: { template: '<span class="reverted-icon" />' },
    },
  }, {
    props: { transaction, showTransactionOwner },
    global: { plugins: [i18n], stubs: { Truncate: true } },
  });
}

function labelText(wrapper) {
  return wrapper.get('.type').text().replace(/\s*,\s*$/, '');
}

enableAutoUnmount(afterEach);

describe('TransactionLabel sponsored swaps', () => {
  beforeEach(() => {
    useAeSdk().nodeNetworkId.value = AE_NETWORK_MAINNET_ID;
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it.each([
    ['the signer row', ACCOUNT, PAYER, false, 'common.swap'],
    ['the payer row', PAYER, ACCOUNT, false, 'transaction.type.transactionFeePaid'],
    ['an aggregated signer row', ACCOUNT, PAYER, true, 'common.swap'],
    ['an aggregated payer row', PAYER, ACCOUNT, true, 'transaction.type.transactionFeePaidBy'],
    ['a row without an owner for the signer', undefined, ACCOUNT, false, 'common.swap'],
    ['a row without an owner for the payer', undefined, PAYER, false, 'transaction.type.transactionFeePaid'],
  ])('labels %s', (_, owner, active, showTransactionOwner, expected) => {
    const transaction = { ...sponsoredSwap(), transactionOwner: owner };

    expect(labelText(mountLabel(transaction, { active, showTransactionOwner })))
      .toBe(tg(expected));
  });

  it.each([
    ['a liquidity call', { function: 'add_liquidity_ae' }],
    ['an unknown contract', { contractId: 'ct_unknown' }],
  ])('keeps the fee label for %s', (_, fields) => {
    const transaction = sponsoredSwap();
    Object.assign(transaction.tx.tx.tx, fields);

    expect(labelText(mountLabel(transaction))).toBe(tg('transaction.type.transactionFeePaid'));
  });

  it.each([
    ['abort', '.warning-icon'],
    ['revert', '.reverted-icon'],
  ])('shows the inner %s of a sponsored swap', (returnType, icon) => {
    const wrapper = mountLabel(sponsoredSwap(returnType));

    expect(wrapper.get('.error-type').text()).toBe(tg(`transaction.returnType.${returnType}`));
    expect(wrapper.find(`.error ${icon}`).exists()).toBe(true);
  });
});
