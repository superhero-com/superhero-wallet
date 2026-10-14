import type { IPopupProps } from '@/types';

describe('usePopupProps', () => {
  async function usePopupPropsIn({ runningInPopup }: { runningInPopup: boolean }) {
    vi.resetModules();
    vi.doMock('@/constants', async () => ({
      ...(await vi.importActual<any>('@/constants')),
      RUNNING_IN_POPUP: runningInPopup,
    }));
    const { usePopupProps } = await import('@/composables/popupProps');
    return usePopupProps();
  }

  it('treats every request in a popup window as signed in the offscreen document', async () => {
    const { isOffscreenRequest, setPopupProps } = await usePopupPropsIn({ runningInPopup: true });
    setPopupProps({} as IPopupProps);

    expect(isOffscreenRequest.value).toBe(true);
  });

  it('elsewhere takes it from the request', async () => {
    const { isOffscreenRequest, setPopupProps } = await usePopupPropsIn({ runningInPopup: false });

    setPopupProps({ isOffscreenRequest: true } as IPopupProps);
    expect(isOffscreenRequest.value).toBe(true);

    setPopupProps({} as IPopupProps);
    expect(isOffscreenRequest.value).toBe(false);
  });
});
