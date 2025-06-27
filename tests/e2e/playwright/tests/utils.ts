import {
  BatchInfo,
  BrowserType,
  Configuration,
  VisualGridRunner,
} from '@applitools/eyes-playwright';
import { chromium } from '@playwright/test';
import path from 'path';

export function genRandomString(characters: string, length: number) {
  let str = '';
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < length; i++) {
    str += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return str;
}

export function initializeRunnerAndConfig(coinName: string): [Configuration, VisualGridRunner] {
  // eslint-disable-next-line global-require
  const branchName = require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  // Configure Applitools SDK to run on the Ultrafast Grid
  const Runner = new VisualGridRunner({ testConcurrency: 5 });
  const Batch = new BatchInfo({
    name: `SH Wallet_${coinName}-${branchName}`,
    id: genRandomString('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 12),
  });

  // Create a configuration for Applitools Eyes.
  const Config = new Configuration();
  // Set the batch for the config.
  Config.setBatch(Batch);
  Config.addBrowser(360, 600, BrowserType.CHROME);
  Config.setApiKey(process.env.APPLITOOLS_KEY!);
  return [Config, Runner];
}

export const createBrowserContext = async () => {
  // assuming your extension is built to the 'public' directory
  const pathToExtension = path.join(__dirname, './public');
  const userDataDir = '/tmp/test-user-data-dir';
  await chromium.launchPersistentContext(
    userDataDir,
    {
      headless: false,
      args: [`--disable-extensions-except=${pathToExtension}`],
      ignoreDefaultArgs: ['--disable-component-extensions-with-background-pages'],
    },
  );
};
