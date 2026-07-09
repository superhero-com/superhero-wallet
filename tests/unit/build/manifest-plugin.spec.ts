import { describe, it, expect } from 'vitest';
import { transformManifest } from '../../../build/manifest-plugin';

function baseManifest() {
  return {
    manifest_version: 3,
    permissions: [
      'storage',
      'scripting',
      'unlimitedStorage',
      'activeTab',
      'tabs',
      'sidePanel',
      'declarativeNetRequestWithHostAccess',
    ],
    background: { service_worker: 'js/background.js' },
    side_panel: { default_title: 'Superhero Wallet', default_path: 'index.html' },
    sidebar_action: { default_title: 'Superhero Wallet', default_panel: 'index.html' },
  };
}

describe('transformManifest', () => {
  it('stamps the given version onto the manifest', () => {
    const manifest = transformManifest(baseManifest(), {
      isFirefox: false,
      unfinishedFeatures: false,
      version: '2.10.2',
    });

    expect(manifest.version).toBe('2.10.2');
  });

  it('adds the clipboardRead permission when unfinishedFeatures is enabled', () => {
    const manifest = transformManifest(baseManifest(), {
      isFirefox: false,
      unfinishedFeatures: true,
      version: '1.0.0',
    });

    expect(manifest.permissions).toContain('clipboardRead');
  });

  it('does not add clipboardRead when unfinishedFeatures is disabled', () => {
    const manifest = transformManifest(baseManifest(), {
      isFirefox: false,
      unfinishedFeatures: false,
      version: '1.0.0',
    });

    expect(manifest.permissions).not.toContain('clipboardRead');
  });

  describe('firefox branch', () => {
    it('switches the background to the offscreen page and sets a gecko id', () => {
      const manifest = transformManifest(baseManifest(), {
        isFirefox: true,
        unfinishedFeatures: false,
        version: '1.0.0',
      });

      expect(manifest.background).toEqual({ page: '/offscreen.html' });
      expect(manifest.browser_specific_settings.gecko.id).toMatch(/^\{.+\}$/);
    });

    it('strips the chrome-only sidePanel feature', () => {
      const manifest = transformManifest(baseManifest(), {
        isFirefox: true,
        unfinishedFeatures: false,
        version: '1.0.0',
      });

      expect(manifest.side_panel).toBeUndefined();
      expect(manifest.permissions).not.toContain('sidePanel');
    });

    it('leaves the chrome-only sidebar_action/offscreen permission alone', () => {
      const manifest = transformManifest(baseManifest(), {
        isFirefox: true,
        unfinishedFeatures: false,
        version: '1.0.0',
      });

      expect(manifest.sidebar_action).toBeDefined();
      expect(manifest.permissions).not.toContain('offscreen');
    });
  });

  describe('chrome (non-firefox) branch', () => {
    it('adds the offscreen permission and drops sidebar_action', () => {
      const manifest = transformManifest(baseManifest(), {
        isFirefox: false,
        unfinishedFeatures: false,
        version: '1.0.0',
      });

      expect(manifest.permissions).toContain('offscreen');
      expect(manifest.sidebar_action).toBeUndefined();
    });

    it('leaves the service-worker background and side_panel untouched', () => {
      const manifest = transformManifest(baseManifest(), {
        isFirefox: false,
        unfinishedFeatures: false,
        version: '1.0.0',
      });

      expect(manifest.background).toEqual({ service_worker: 'js/background.js' });
      expect(manifest.side_panel).toBeDefined();
    });
  });
});
