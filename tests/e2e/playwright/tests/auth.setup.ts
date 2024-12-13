import { test as setup } from '@playwright/test';
import { RestoreWalletData } from '../test-data/login.data';
import { WelcomePage } from '../pages/welcome.page';
import { interceptApiRequests } from './commands';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page, context }) => {
  await interceptApiRequests(context);
  const welcomePage = new WelcomePage(page);

  await page.goto('./');
  await welcomePage.recoveredWalletLogin(RestoreWalletData.testWalletSeed);
  await page.waitForURL('./account');

  await page.context().storageState({ path: authFile });
});
