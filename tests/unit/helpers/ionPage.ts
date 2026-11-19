import { nextTick } from 'vue';

/** An Ionic page element, whose `ion-page-hidden` class `usePageVisibility` follows */
export function createIonPage(parent: Element = document.body) {
  const page = document.createElement('div');
  page.classList.add('ion-page');
  parent.appendChild(page);
  return page;
}

/** Waits for the MutationObserver and the Vue watchers it triggers. */
export async function setIonPageHidden(page: Element, isHidden: boolean) {
  page.classList.toggle('ion-page-hidden', isHidden);
  await Promise.resolve();
  await nextTick();
}
