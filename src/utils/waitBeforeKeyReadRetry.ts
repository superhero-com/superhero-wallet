/** Kept apart from `mobileEncryption.ts` so unit tests can skip the real waits. */
export function waitBeforeKeyReadRetry(ms: number) {
  return new Promise<void>((resolve) => { setTimeout(resolve, ms); });
}
