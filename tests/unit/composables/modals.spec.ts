import { useModals } from '@/composables/modals';
import { usePopupProps } from '@/composables/popupProps';

/**
 * The confirmation modals read their request from `usePopupProps`, which is how
 * the side panel and the web frame popups pass it to them.
 */
describe('useModals', () => {
  const { openModal, registerModal } = useModals();
  const { popupProps, setPopupProps } = usePopupProps();

  afterEach(() => setPopupProps(null));

  it('hands the props of a confirmation modal to usePopupProps', async () => {
    registerModal('test-confirmation', { showInPopupIfWebFrame: true });

    const result = openModal('test-confirmation', { message: 'hello' });
    expect(popupProps.value).toMatchObject({ message: 'hello' });

    popupProps.value!.resolve('signed');
    await expect(result).resolves.toBe('signed');
  });

  it('leaves usePopupProps alone for other modals', () => {
    registerModal('test-default', {});

    openModal('test-default', { message: 'hello' });
    expect(popupProps.value).toBeNull();
  });
});
