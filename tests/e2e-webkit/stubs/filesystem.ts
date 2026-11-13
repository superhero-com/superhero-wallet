import { Directory, Filesystem } from '@capacitor/filesystem/dist/esm/index.js';

// An iPhone app always has this folder; the iOS migrations read it at startup.
await Filesystem.mkdir({ path: 'Caches', directory: Directory.Library }).catch(() => {});

export * from '@capacitor/filesystem/dist/esm/index.js';
