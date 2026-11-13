import { mount } from '@vue/test-utils';
import { PROTOCOLS } from '@/constants';
import { STUB_ADDRESS } from '@/constants/stubs';
import { i18n, tg } from '@/popup/plugins/i18n';
import type { ITransaction } from '@/types';
import TransactionLabel from '@/popup/components/TransactionLabel.vue';

function nameClaim(name: string, pending = false): ITransaction {
  return {
    hash: 'th_bid',
    protocol: PROTOCOLS.aeternity,
    transactionOwner: STUB_ADDRESS,
    pending,
    tx: {
      type: 'NameClaimTx', accountId: STUB_ADDRESS, name, nameSalt: '0',
    },
  };
}

function mountLabel(transaction: ITransaction) {
  return mount(TransactionLabel, {
    props: { transaction },
    global: { plugins: [i18n] },
  });
}

describe('TransactionLabel name bids', () => {
  it('shows a bid label for an auction and preserves ordinary claim labels', () => {
    const bid = mountLabel(nameClaim('test.chain'));
    const claim = mountLabel(nameClaim('ordinarylongname.chain'));

    expect(bid.find('.type').text()).toBe(tg('transaction.listType.nameBid'));
    expect(claim.find('.type').text()).toBe(tg('transaction.listType.nameClaimTx'));
  });

  it('keeps a pending bid generic and shows its bid label when mined', async () => {
    const transaction = nameClaim('test.chain', true);
    const wrapper = mountLabel(transaction);

    expect(wrapper.find('.type').exists()).toBe(false);
    expect(wrapper.find('.label').text()).toBe(tg('common.pending'));

    await wrapper.setProps({ transaction: { ...transaction, pending: false } });

    expect(wrapper.find('.type').text()).toBe(tg('transaction.listType.nameBid'));
    expect(wrapper.find('.label').text()).not.toContain(tg('common.pending'));
  });
});
