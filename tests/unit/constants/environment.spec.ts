import { readFileSync } from 'fs';
import path from 'path';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const manifest = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../../src/manifest.json'), 'utf-8'),
);

async function loadIsSidePanel(pagePath: string, platform: string) {
  vi.stubEnv('PLATFORM', platform);
  window.history.replaceState(null, '', `/${pagePath}`);
  vi.resetModules();
  return (await import('@/constants/environment')).IS_SIDE_PANEL;
}

describe('IS_SIDE_PANEL', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    window.history.replaceState(null, '', '/');
  });

  it.each([
    ['Chrome side panel', manifest.side_panel.default_path],
    ['Firefox sidebar', manifest.sidebar_action.default_panel],
  ])('is true in the %s', async (_, pagePath) => {
    expect(await loadIsSidePanel(pagePath, 'extension')).toBe(true);
  });

  it('is false in the action popup', async () => {
    expect(await loadIsSidePanel(manifest.action.default_popup, 'extension')).toBe(false);
  });

  it('is false outside of the extension', async () => {
    expect(await loadIsSidePanel('?sidepanel', 'web')).toBe(false);
  });
});
