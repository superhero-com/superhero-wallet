// @ts-nocheck
import { Page } from '@playwright/test';

export class Dashboard {
  constructor(private page: Page) {
    this.page = page;
  }

  firefoxExtensionLink = this.page.getByRole('link', { name: 'Firefox' });
}
