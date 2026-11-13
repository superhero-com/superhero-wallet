import axe from 'axe-core';

/** The name assistive technologies announce for the element. */
export function accessibleName(element: Element) {
  axe.setup(document);
  try {
    return axe.commons.text.accessibleText(element);
  } finally {
    axe.teardown();
  }
}
