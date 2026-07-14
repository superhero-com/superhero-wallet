import type { WalletAppRouteConfig } from '@/types';
import {
  IS_MOBILE_APP,
  PROTOCOL_VIEW_ACCOUNT_DETAILS,
  PROTOCOL_VIEW_TRANSACTION_DETAILS,
  PROTOCOL_VIEW_ACCOUNT_DETAILS_ASSETS,
  PROTOCOL_VIEW_ACCOUNT_DETAILS_NAMES,
} from '@/constants';
import {
  useAuth,
  useModals,
  useUi,
  useWalletConnect,
  type WalletConnectUri,
} from '@/composables';
import { tg } from '@/popup/plugins/i18n';
import {
  ROUTE_INDEX,
  ROUTE_ACCOUNT,
  ROUTE_ACCOUNT_DETAILS,
  ROUTE_ACCOUNT_DETAILS_ASSETS,
  ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS,
  ROUTE_APPS_BROWSER,
  ROUTE_NOTIFICATIONS,
  ROUTE_COIN,
  ROUTE_TOKEN,
  ROUTE_NOT_FOUND,
  ROUTE_ACCOUNT_DETAILS_NAMES,
  ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
  ROUTE_MULTISIG_DETAILS_INFO,
  ROUTE_NETWORK_SETTINGS,
  ROUTE_MULTISIG_ACCOUNT,
  ROUTE_MULTISIG_DETAILS,
  ROUTE_MULTISIG_DETAILS_ASSETS,
  ROUTE_MULTISIG_TX_DETAILS,
  ROUTE_TX_DETAILS,
  ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS,
  ROUTE_MULTISIG_COIN,
  ROUTE_MULTISIG_COIN_DETAILS,
  ROUTE_COIN_DETAILS,
  ROUTE_TOKEN_DETAILS,
  ROUTE_NETWORK_ADD,
  ROUTE_NETWORK_EDIT,
  ROUTE_INVITE,
  ROUTE_INVITE_CLAIM,
  ROUTE_DONATE_ERROR,
  ROUTE_AUCTION_BID,
  ROUTE_AUCTION_HISTORY,
  ROUTE_POPUP_ACCOUNT_LIST,
  ROUTE_POPUP_SIGN_TX,
  ROUTE_POPUP_CONNECT,
  ROUTE_POPUP_RAW_SIGN,
  ROUTE_POPUP_UNSAFE_SIGN,
  ROUTE_POPUP_MESSAGE_SIGN,
  ROUTE_PERMISSIONS_SETTINGS,
  ROUTE_PERMISSIONS_ADD,
  ROUTE_PERMISSIONS_DETAILS,
  ROUTE_SECURE_LOGIN_SETTINGS,
  ROUTE_ADDRESS_BOOK,
  ROUTE_ADDRESS_BOOK_EDIT,
  ROUTE_ADDRESS_BOOK_ADD,
  ROUTE_SEED_PHRASE_SETTINGS,
  ROUTE_SEED_PHRASE_DETAILS,
  ROUTE_SEED_PHRASE_VERIFY,
  ROUTE_ABOUT,
  ROUTE_TIPS_CLAIM,
  ROUTE_TOKEN_SALES,
  ROUTE_SETTINGS,
} from './routeNames';

// Kept as static imports: they sit on the first-paint/auth path (Index,
// Dashboard, ProtocolSpecificView, AccountDetailsTransactions, AssetDetails*),
// serve the extension's dapp-confirm popup windows (Confirm*Sign, Popup*),
// which race dapp callbacks and must render the instant the popup opens, or
// are exercised by `RouteLastUsedRoutes` (NamesList/AuctionList/NameClaim,
// About) — see note below. Everything else is loaded via `() => import(...)`
// at its route definition so it only downloads when actually navigated to.
//
// RouteLastUsedRoutes stores the current route in `router.afterEach`, which
// vue-router only fires once a route's async component (if any) has resolved.
// tests/e2e/integration/other.cy.js's last-visited-route test does a hard
// reload immediately after navigating, then asserts the route was restored;
// against a not-yet-cached lazy chunk this races the chunk fetch against a
// fixed assertion timeout and fails intermittently-to-consistently depending
// on machine speed. NamesList and About are the two routes that test happens
// to sample and were caught failing; AuctionList/NameClaim sit under the same
// 'names' parent and share the identical (untested-by-that-spec) risk, so
// they're kept eager too rather than leave the same race latent. This is a
// narrow, pre-existing fragility in `RouteLastUsedRoutes` itself (not
// something introduced here) that lazy-loading exposes — fixing it at the
// root is out of scope for a bundle-size pass, so the safe move is keeping
// routes it's proven (or structurally likely) to touch on the eager list.
import AccountDetailsTransactions from '../components/AccountDetailsTransactionsBase.vue';
import Dashboard from '../pages/Dashboard.vue';
import ConfirmTransactionSign from '../components/Modals/ConfirmTransactionSign.vue';
import ConfirmRawSign from '../components/Modals/ConfirmRawSign.vue';
import AssetDetails from '../pages/Assets/AssetDetails.vue';
import AssetDetailsTransactions from '../pages/Assets/AssetDetailsTransactions.vue';
import AssetDetailsInfo from '../pages/Assets/AssetDetailsInfo.vue';
import Index from '../pages/Index.vue';
import NamesList from '../pages/Names/NamesList.vue';
import AuctionList from '../pages/Names/AuctionList.vue';
import NameClaim from '../pages/Names/Claim.vue';
import About from '../pages/About.vue';
import PopupConnect from '../pages/Popups/Connect.vue';
import PopupAccountList from '../pages/Popups/AccountList.vue';
import PopupMessageSign from '../pages/Popups/MessageSign.vue';
import ProtocolSpecificView from '../components/ProtocolSpecificView.vue';
import webIframePopups from './webIframePopups';
import ConfirmUnsafeSign from '../components/Modals/ConfirmUnsafeSign.vue';

async function requireSeedPhraseReauth() {
  const {
    isUsingDefaultPassword,
    checkBiometricLoginAvailability,
  } = useAuth();
  const { isBiometricLoginEnabled } = useUi();
  const {
    openConfirmModal,
    openPasswordLoginModal,
    openBiometricLoginModal,
  } = useModals();

  if (IS_MOBILE_APP) {
    if (isBiometricLoginEnabled.value && await checkBiometricLoginAvailability()) {
      await openBiometricLoginModal({ force: true });
      return;
    }
    await openConfirmModal({
      title: tg('pages.titles.seedPhrase'),
      msg: tg('pages.seed-phrase-settings.revealConfirmMsg'),
    });
    return;
  }

  if (isUsingDefaultPassword.value) {
    await openConfirmModal({
      title: tg('pages.titles.seedPhrase'),
      msg: tg('pages.seed-phrase-settings.revealConfirmMsg'),
    });
    return;
  }

  await openPasswordLoginModal();
}

export const routes: WalletAppRouteConfig[] = [
  ...webIframePopups,
  {
    path: '/',
    name: ROUTE_INDEX,
    component: Index,
    meta: {
      useDefaultHardwareBackButton: true,
      ifNotAuthOnly: true,
      notPersist: true,
    },
  },
  {
    path: '/account',
    name: ROUTE_ACCOUNT,
    component: Dashboard,
  },
  {
    path: '/account-details',
    component: ProtocolSpecificView,
    props: { viewComponentName: PROTOCOL_VIEW_ACCOUNT_DETAILS },
    children: [
      {
        path: '',
        name: ROUTE_ACCOUNT_DETAILS,
        component: AccountDetailsTransactions,
        meta: {
          showFilterBar: true,
        },
      },
      {
        path: 'assets',
        name: ROUTE_ACCOUNT_DETAILS_ASSETS,
        component: ProtocolSpecificView,
        props: { viewComponentName: PROTOCOL_VIEW_ACCOUNT_DETAILS_ASSETS },
        meta: {
          useDefaultHardwareBackButton: true,
          redirectIfNull: ROUTE_ACCOUNT_DETAILS,
          showFilterBar: true,
          hideFilterButton: true,
        },
      },
      {
        path: 'names',
        component: ProtocolSpecificView,
        props: { viewComponentName: PROTOCOL_VIEW_ACCOUNT_DETAILS_NAMES },
        meta: {
          redirectIfNull: ROUTE_ACCOUNT_DETAILS,
        },
        children: [
          {
            path: '',
            name: ROUTE_ACCOUNT_DETAILS_NAMES,
            component: NamesList,
            props: true,
            meta: {
              useDefaultHardwareBackButton: true,
            },
          },
          {
            path: 'auctions',
            component: AuctionList,
            props: true,
            name: ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS,
            meta: {
              useDefaultHardwareBackButton: true,
            },
          },
          {
            path: 'claim',
            component: NameClaim,
            props: true,
            name: ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
            meta: {
              useDefaultHardwareBackButton: true,
            },
          },
        ],
      },
    ],
  },
  {
    path: '/account-details/transactions/:hash/:transactionOwner',
    name: ROUTE_TX_DETAILS,
    component: ProtocolSpecificView,
    props: { viewComponentName: PROTOCOL_VIEW_TRANSACTION_DETAILS },
    meta: {
      backRoute: { name: ROUTE_ACCOUNT_DETAILS },
    },
  },
  {
    path: '/multisig',
    component: () => import('../components/DefaultPagesRouter.vue'),
    meta: {
      isMultisig: true,
    },
    children: [
      {
        path: '',
        name: ROUTE_MULTISIG_ACCOUNT,
        component: () => import('../pages/DashboardMultisig.vue'),
      },
      {
        path: 'details/',
        component: () => import('../pages/AccountDetailsMultisig.vue'),
        children: [
          {
            path: 'assets',
            name: ROUTE_MULTISIG_DETAILS_ASSETS,
            component: () => import('../pages/AccountDetailsMultisigTokens.vue'),
            meta: {
              useDefaultHardwareBackButton: true,
              showFilterBar: true,
              hideFilterButton: true,
            },
          },
          {
            path: '',
            name: ROUTE_MULTISIG_DETAILS,
            component: () => import('../pages/AccountDetailsMultisigTransactions.vue'),
            meta: {
              useDefaultHardwareBackButton: true,
              showFilterBar: true,
            },
          },
          {
            path: 'info',
            name: ROUTE_MULTISIG_DETAILS_INFO,
            component: () => import('../pages/MultisigDetails.vue'),
            meta: {
              useDefaultHardwareBackButton: true,
            },
          },
        ],
      },

      {
        path: 'details/transactions/:hash/:transactionOwner',
        name: ROUTE_MULTISIG_TX_DETAILS,
        component: () => import('../../protocols/aeternity/views/TransactionDetails.vue'),
        props: { multisigDashboard: true },
        meta: {
          backRoute: { name: ROUTE_MULTISIG_DETAILS },
        },
      },
      {
        path: 'details/multisig-proposals',
        name: ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS,
        component: () => import('../pages/MultisigProposalDetails.vue'),
        props: true,
        meta: {
          backRoute: { name: ROUTE_MULTISIG_DETAILS },
        },
      },
      {
        /**
         * When a route is defined with a parameter and user leaves this route, vue-router will
         * throw a "missing required param" error even though the parameter was set for the route
         * Making the parameter optional & checking for it in the beforeEnter hook fixes the issue
         *
         * @see https://github.com/vuejs/router/issues/845
         */
        path: 'coins/:id?',
        component: AssetDetails,
        beforeEnter: (to, from, next) => {
          if (!to.params.id) {
            next({ name: ROUTE_MULTISIG_ACCOUNT });
            return;
          }
          next();
        },
        children: [
          {
            name: ROUTE_MULTISIG_COIN,
            path: '',
            component: () => import('../pages/AccountDetailsMultisigTransactions.vue'),
            props: true,
            meta: {
              backRoute: { name: ROUTE_MULTISIG_DETAILS_ASSETS },
              showFilterBar: true,
              hideSearchBar: true,
              isMultisig: true,
            },
          },
          {
            name: ROUTE_MULTISIG_COIN_DETAILS,
            path: 'details',
            component: AssetDetailsInfo,
            props: true,
            meta: {
              backRoute: { name: ROUTE_MULTISIG_DETAILS_ASSETS },
              isMultisig: true,
            },
          },
        ],
      },
    ],
  },
  {
    path: '/transfer/:t(.*)',
    redirect: '/account/:a(.*)',
  },
  {
    name: ROUTE_POPUP_SIGN_TX,
    path: '/popup-sign-tx',
    component: ConfirmTransactionSign,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: ROUTE_POPUP_RAW_SIGN,
    path: '/popup-raw-sign',
    component: ConfirmRawSign,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: ROUTE_POPUP_UNSAFE_SIGN,
    path: '/popup-unsafe-sign',
    component: ConfirmUnsafeSign,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: ROUTE_POPUP_CONNECT,
    path: '/connect',
    component: PopupConnect,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: ROUTE_POPUP_MESSAGE_SIGN,
    path: '/message-sign',
    component: PopupMessageSign,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: ROUTE_POPUP_ACCOUNT_LIST,
    path: '/account-list',
    component: PopupAccountList,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    path: '/more/settings',
    name: ROUTE_SETTINGS,
    component: () => import('../pages/Settings.vue'),
  },
  {
    path: '/more/settings/reset-wallet',
    name: 'settings-reset-wallet',
    component: () => import('../pages/ResetWallet.vue'),
  },
  {
    path: '/more/settings/errors-log',
    name: 'settings-errors-log',
    component: () => import('../pages/ErrorLogSettings.vue'),
  },
  {
    path: '/more/settings/language',
    name: 'settings-language',
    component: () => import('../pages/LanguageSettings.vue'),
  },
  {
    path: '/more/settings/currency',
    name: 'settings-currency',
    component: () => import('../pages/CurrencySettings.vue'),
  },
  {
    path: '/more/settings/seed-phrase',
    name: ROUTE_SEED_PHRASE_SETTINGS,
    component: () => import('../pages/SeedPhraseSettings.vue'),
  },
  {
    path: '/more/settings/seed-phrase/details',
    name: ROUTE_SEED_PHRASE_DETAILS,
    component: () => import('../pages/SeedPhraseDetailsSettings.vue'),
    beforeEnter: async (_to, _from, next) => {
      try {
        await requireSeedPhraseReauth();
        next();
      } catch {
        next(false);
      }
    },
  },
  {
    path: '/more/settings/seed-phrase/details/verify',
    name: ROUTE_SEED_PHRASE_VERIFY,
    component: () => import('../pages/SeedPhraseVerifySettings.vue'),
    beforeEnter: async (_to, _from, next) => {
      try {
        await requireSeedPhraseReauth();
        next();
      } catch {
        next(false);
      }
    },
  },
  {
    path: '/more/settings/secure-login',
    component: () => import('../pages/SecureLoginSettings.vue'),
    name: ROUTE_SECURE_LOGIN_SETTINGS,
  },
  {
    path: '/more/settings/networks',
    name: ROUTE_NETWORK_SETTINGS,
    component: () => import('../pages/Networks.vue'),
    props: true,
  },
  {
    path: '/more/settings/networks/add',
    name: ROUTE_NETWORK_ADD,
    component: () => import('../pages/NetworkForm.vue'),
    props: true,
  },
  {
    path: '/more/settings/networks/:name',
    name: ROUTE_NETWORK_EDIT,
    component: () => import('../pages/NetworkForm.vue'),
    props: true,
  },
  {
    path: '/more/settings/token-sales',
    component: () => import('../pages/TokenSalesSettings.vue'),
    name: ROUTE_TOKEN_SALES,
  },
  {
    path: '/more/settings/permissions',
    component: () => import('../pages/PermissionsSettings.vue'),
    name: ROUTE_PERMISSIONS_SETTINGS,
  },
  {
    path: '/more/settings/permissions/add',
    component: () => import('../pages/PermissionManager.vue'),
    name: ROUTE_PERMISSIONS_ADD,
  },
  {
    path: '/more/settings/permissions/:host',
    component: () => import('../pages/PermissionManager.vue'),
    name: ROUTE_PERMISSIONS_DETAILS,
    meta: {
      isEdit: true,
    },
  },
  {
    path: '/more/about',
    component: About,
    name: ROUTE_ABOUT,
  },
  {
    path: '/more/about/terms',
    component: () => import('../pages/TermsOfService.vue'),
    name: 'about-terms',
    meta: {
      showScrollbar: true,
      ifNotAuth: true,
    },
  },
  {
    path: '/more/about/privacy',
    component: () => import('../pages/PrivacyPolicy.vue'),
    name: 'about-privacy',
    meta: {
      ifNotAuth: true,
      showScrollbar: true,
    },
  },
  {
    path: '/more/tips-claim',
    name: ROUTE_TIPS_CLAIM,
    component: () => import('../pages/TipsClaim.vue'),
  },
  {
    path: '/tips',
    redirect: '/account',
  },
  {
    path: '/retip',
    component: () => import('../pages/Retip.vue'),
    meta: {
      notPersist: true,
    },
  },
  {
    path: '/more',
    component: () => import('../pages/More.vue'),
    name: 'more',
  },
  {
    path: '/more/invite',
    name: ROUTE_INVITE,
    component: () => import('../pages/Invite.vue'),
  },
  {
    path: '/more/settings/notifications',
    name: 'notification-settings',
    component: () => import('../pages/NotificationSettings.vue'),
  },
  {
    name: ROUTE_ADDRESS_BOOK,
    path: '/more/address-book',
    component: () => import('../pages/AddressBook.vue'),
    meta: {
      notPersist: true,
    },
  },
  {
    name: ROUTE_ADDRESS_BOOK_ADD,
    path: '/more/address-book/add',
    component: () => import('../pages/AddressBookForm.vue'),
    props: true,
  },
  {
    name: ROUTE_ADDRESS_BOOK_EDIT,
    path: '/more/address-book/:id',
    component: () => import('../pages/AddressBookForm.vue'),
    meta: {
      notPersist: true,
    },
  },
  {
    path: '/account-details/names/auctions/:name/',
    component: () => import('../pages/Names/Auction.vue'),
    props: true,
    children: [
      {
        path: '',
        component: () => import('../pages/Names/AuctionBid.vue'),
        props: true,
        name: ROUTE_AUCTION_BID,
      },
      {
        path: 'history',
        component: () => import('../pages/Names/AuctionHistory.vue'),
        props: true,
        name: ROUTE_AUCTION_HISTORY,
        meta: {
          backRoute: { name: ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS },
        },
      },
    ],
  },
  {
    path: '/comment',
    component: () => import('../pages/CommentNew.vue'),
    meta: {
      notPersist: true,
    },
  },
  {
    name: ROUTE_DONATE_ERROR,
    path: '/donate-error',
    component: () => import('../pages/DonateError.vue'),
    props: true,
    meta: {
      notPersist: true,
      ifNotAuth: true,
    },
  },
  {
    name: 'address',
    path: '/address',
    component: () => import('../pages/Address.vue'),
    meta: {
      useDefaultHardwareBackButton: true,
      notPersist: true,
    },
  },
  {
    // see https://github.com/vuejs/router/issues/845
    path: '/coins/:id?',
    component: AssetDetails,
    beforeEnter: (to, from, next) => {
      if (!to.params.id) {
        next({ name: ROUTE_ACCOUNT });
        return;
      }
      next();
    },
    children: [
      {
        name: ROUTE_COIN,
        path: '',
        component: AssetDetailsTransactions,
        props: true,
        meta: {
          backRoute: { name: ROUTE_ACCOUNT_DETAILS_ASSETS },
          showFilterBar: true,
          hideSearchBar: true,
        },
      },
      {
        name: ROUTE_COIN_DETAILS,
        path: 'details',
        component: AssetDetailsInfo,
        props: true,
        meta: {
          backRoute: { name: ROUTE_ACCOUNT_DETAILS_ASSETS },
        },
      },
    ],
  },
  {
    // see https://github.com/vuejs/router/issues/845
    path: '/tokens/:id?',
    component: AssetDetails,
    beforeEnter: (to, from, next) => {
      if (!to.params.id) {
        next({ name: ROUTE_ACCOUNT });
        return;
      }
      next();
    },
    children: [
      {
        name: ROUTE_TOKEN,
        path: '',
        component: AssetDetailsTransactions,
        props: true,
        meta: {
          backRoute: { name: ROUTE_ACCOUNT_DETAILS_ASSETS },
          showFilterBar: true,
          hideSearchBar: true,
        },
      },
      {
        name: ROUTE_TOKEN_DETAILS,
        path: 'details',
        component: AssetDetailsInfo,
        props: true,
        meta: {
          backRoute: { name: ROUTE_ACCOUNT_DETAILS_ASSETS },
        },
      },
    ],
  },
  {
    name: 'sign-message',
    path: '/sign-message',
    component: () => import('../pages/SignMessage.vue'),
    meta: {
      useDefaultHardwareBackButton: true,
      notPersist: true,
    },
  },
  {
    name: 'sign-transaction',
    path: '/sign-transaction',
    component: () => import('../pages/SignTransaction.vue'),
    meta: {
      useDefaultHardwareBackButton: true,
      notPersist: true,
    },
  },
  {
    name: 'sign-jwt',
    path: '/sign-jwt',
    component: () => import('../pages/JwtSign.vue'),
    meta: {
      useDefaultHardwareBackButton: true,
      notPersist: true,
    },
  },
  {
    // Web deep link equivalent to native wc:// handler
    name: 'wc',
    path: '/wc',
    component: Index,
    meta: {
      useDefaultHardwareBackButton: true,
      notPersist: true,
    },
    beforeEnter: async (to, from, next) => {
      const { connect, wcSession } = useWalletConnect();
      const uriParam = to.query.uri as string | undefined;

      if (!uriParam) {
        next({ name: ROUTE_NOT_FOUND });
        return;
      }

      try {
        if (!wcSession.value) {
          await connect(uriParam as WalletConnectUri, true);
        }
      } catch {
        // Let the error modal from connect handle user feedback
      }

      next({ name: ROUTE_ACCOUNT });
    },
  },
  {
    name: ROUTE_APPS_BROWSER,
    path: '/apps-browser',
    component: () => import('../pages/AppsBrowser.vue'),
    meta: {
      useDefaultHardwareBackButton: true,
      notPersist: true,
    },
  },
  {
    name: ROUTE_INVITE_CLAIM,
    path: '/invite/:secretKey?',
    component: () => import('../pages/InviteClaim.vue'),
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: ROUTE_NOTIFICATIONS,
    path: '/notifications',
    component: () => import('../pages/Notifications.vue'),
    meta: {
      notPersist: true,
    },
  },
  {
    name: ROUTE_NOT_FOUND,
    path: '/page-not-found',
    component: () => import('../pages/NotFound.vue'),
    props: true,
    meta: {
      ifNotAuth: true,
      notPersist: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: ROUTE_NOT_FOUND },
    props: true,
    meta: {
      ifNotAuth: true,
      notPersist: true,
    },
  },
];
