process.env.COMMIT_HASH = 'a1c1c5acc851c49248aad87088963f9ae5fb200e';

// https://github.com/jestjs/jest/issues/13349
// eslint-disable-next-line no-global-assign, no-proto
Uint8Array = Buffer.__proto__;
