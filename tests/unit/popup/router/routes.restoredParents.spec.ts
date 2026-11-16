import { createMemoryHistory, createRouter, type RouteRecordRaw } from 'vue-router';
import { routes } from '@/popup/router/routes';
import { RouteLastUsedRoutes } from '@/lib/RouteLastUsedRoutes';
import { ROUTE_ACCOUNT } from '@/popup/router/routeNames';

const storage = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), remove: vi.fn() }));

vi.mock('@/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/constants')>()),
  IS_IOS: true,
  IS_MOBILE_APP: true,
  RUNNING_IN_POPUP: false,
}));
vi.mock('@/lib/WalletStorage', () => ({ WalletStorage: storage }));

function makeRouter() {
  return createRouter({ history: createMemoryHistory(), routes: routes as RouteRecordRaw[] });
}

/** One path per page that the app saves as the last route. */
function listSavedPages() {
  const router = makeRouter();
  const pages = new Map<unknown, string>();
  router.getRoutes().forEach(({ path }) => {
    const page = router.resolve(path.replace(/:\w+(\([^)]*\))?\??/g, 'x'));
    if (page.name && !page.meta.notPersist && !pages.has(page.name)) {
      pages.set(page.name, page.path);
    }
  });
  return [...pages.values()];
}

/** The page iOS restoration opens first, so that swipe-back has a page to return to. */
async function getRestoredParent(path: string) {
  storage.get.mockReturnValue({ path, time: new Date().toISOString() });
  const router = makeRouter();
  const restoration = RouteLastUsedRoutes.init(router, () => true)!;
  let parent: string | undefined;
  router.beforeEach((to) => {
    parent = restoration.restoreAfterAuth(to);
    return false;
  });
  await router.push('/');
  return parent;
}

it('restores every saved page over its parent, skipping only the guarded seed phrase parent', async () => {
  const dashboard = makeRouter().resolve({ name: ROUTE_ACCOUNT }).path;
  const withoutParent: string[] = [];
  const topLevelElsewhere: string[] = [];
  const nestedOverDashboard: string[] = [];
  await listSavedPages().reduce(async (previous, path) => {
    await previous;
    const parent = await getRestoredParent(path);
    const isTopLevel = path.split('/').filter(Boolean).length === 1;
    if (!parent) withoutParent.push(path);
    else if (isTopLevel && parent !== dashboard) topLevelElsewhere.push(path);
    else if (!isTopLevel && parent === dashboard) nestedOverDashboard.push(path);
  }, Promise.resolve());

  expect(withoutParent).toEqual([dashboard]);
  // Like the More tab, top-level pages open over the dashboard.
  expect(topLevelElsewhere).toEqual([]);
  // Its parent asks for the password again.
  expect(nestedOverDashboard).toEqual(['/more/settings/seed-phrase/details/verify']);
});
