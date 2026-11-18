// @ts-nocheck
const ITEM_KEY = 'sh-wallet_address-book';
const ALICE = 'ak_2fxchiLvnj9VADMAXHBiKPsaCEsTFehAspcmWJ3ZzF3pFK1hB5';
const BOB = 'ak_2ELPCWzcTdiyYuumjaV4D7kE843d1Ts27zH1Y2LBMKDbNtfq1Q';

describe('address book with another window', () => {
  let useAddressBook;
  let storageListeners;

  const nextTask = () => new Promise((resolve) => { setTimeout(resolve, 0); });
  const storedNames = () => JSON.parse(localStorage.getItem(ITEM_KEY)).map(({ name }) => name);

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    storageListeners = [];
    const addEventListener = window.addEventListener.bind(window);
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, ...rest) => {
      if (type === 'storage') storageListeners.push(listener);
      addEventListener(type, listener, ...rest);
    });
    await import('@/protocols/registerAdapters');
    ({ useAddressBook } = await import('@/composables/addressBook'));
    await nextTask();
  });

  afterEach(() => {
    storageListeners.forEach((listener) => window.removeEventListener('storage', listener));
    vi.restoreAllMocks();
  });

  it('keeps an entry another window added', async () => {
    const alice = {
      name: 'Alice', address: ALICE, protocol: 'aeternity', isBookmarked: false,
    };
    const newValue = JSON.stringify([alice]);
    localStorage.setItem(ITEM_KEY, newValue);
    window.dispatchEvent(new StorageEvent('storage', {
      key: ITEM_KEY, newValue, storageArea: localStorage,
    }));

    useAddressBook().addAddressBookEntry({ name: 'Bob', address: BOB });
    await nextTask();

    expect(storedNames()).toEqual(['Alice', 'Bob']);
    expect(useAddressBook().addressBook.value.map(({ name }) => name)).toEqual(['Alice', 'Bob']);
  });
});
