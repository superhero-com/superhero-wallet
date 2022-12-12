import { WalletAppRouteConfig } from '../../types';

import ConfirmTransactionSign from '../components/Modals/ConfirmTransactionSign.vue';
import ConfirmRawSign from '../components/Modals/ConfirmRawSign.vue';
import About from '../pages/About.vue';
import AccountDetails from '../pages/AccountDetails.vue';
import AccountDetailsTokens from '../pages/AccountDetailsTokens.vue';
import AccountDetailsTransactions from '../pages/AccountDetailsTransactions.vue';
import AccountDetailsNames from '../pages/AccountDetailsNames.vue';
import Dashboard from '../pages/Dashboard.vue';
import Address from '../pages/Address.vue';
import CommentNew from '../pages/CommentNew.vue';
import DonateError from '../pages/DonateError.vue';
import TokenContainer from '../pages/FungibleTokens/TokenContainer.vue';
import TokenTransactions from '../pages/FungibleTokens/TokenTransactions.vue';
import TokenDetails from '../pages/FungibleTokens/TokenDetails.vue';
import Index from '../pages/Index.vue';
import Invite from '../pages/Invite.vue';
import InviteClaim from '../pages/InviteClaim.vue';
import LanguageSettings from '../pages/LanguageSettings.vue';
import CurrencySettings from '../pages/CurrencySettings.vue';
import Auction from '../pages/Names/Auction.vue';
import AuctionBid from '../pages/Names/AuctionBid.vue';
import AuctionHistory from '../pages/Names/AuctionHistory.vue';
import AuctionList from '../pages/Names/AuctionList.vue';
import More from '../pages/More.vue';
import NameClaim from '../pages/Names/Claim.vue';
import NamesList from '../pages/Names/List.vue';
import NotFound from '../pages/NotFound.vue';
import Notifications from '../pages/Notifications.vue';
import NotificationSettings from '../pages/NotificationSettings.vue';
import ErrorLogSettings from '../pages/ErrorLogSettings.vue';
import PermissionsSettings from '../pages/PermissionsSettings.vue';
import PermissionManager from '../pages/PermissionManager.vue';
import PopupConnect from '../pages/Popups/Connect.vue';
import PopupMessageSign from '../pages/Popups/MessageSign.vue';
import PrivacyPolicy from '../pages/PrivacyPolicy.vue';
import Retip from '../pages/Retip.vue';
import SeedPhraseSettings from '../pages/SeedPhraseSettings.vue';
import SeedPhraseDetailsSettings from '../pages/SeedPhraseDetailsSettings.vue';
import SeedPhraseVerifySettings from '../pages/SeedPhraseVerifySettings.vue';
import Settings from '../pages/Settings.vue';
import SignMessage from '../pages/SignMessage.vue';
import SignTransaction from '../pages/SignTransaction.vue';
import TermsOfService from '../pages/TermsOfService.vue';
import TipsClaim from '../pages/TipsClaim.vue';
import TransactionDetails from '../pages/TransactionDetails.vue';
import ResetWallet from '../pages/ResetWallet.vue';
import webIframePopups from './webIframePopups';
import Networks from '../pages/Networks.vue';
import NetworkForm from '../pages/NetworkForm.vue';

export const ROUTE_INDEX = 'index';
export const ROUTE_ACCOUNT = 'account';
export const ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS = 'account-details-names-auctions';

export const routes: WalletAppRouteConfig[] = [
  ...webIframePopups,
  {
    path: '/',
    name: ROUTE_INDEX,
    component: Index,
    meta: {
      title: '',
      hideHeader: true,
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
    path: '/transfer*',
    redirect: '/account*',
  },
  {
    path: '/account-details/',
    component: AccountDetails,
    children: [
      {
        path: '',
        name: 'account-details',
        component: AccountDetailsTokens,
        meta: {
          hideHeader: true,
          asModal: true,
        },
      },
      {
        path: 'transactions',
        name: 'account-details-transactions',
        component: AccountDetailsTransactions,
        meta: {
          hideHeader: true,
          asModal: true,
        },
      },
      {
        path: 'names',
        component: AccountDetailsNames,
        children: [
          {
            path: '',
            name: 'account-details-names',
            component: NamesList,
            props: true,
            meta: {
              hideHeader: true,
              asModal: true,
            },
          },
          {
            path: 'auctions',
            component: AuctionList,
            props: true,
            name: 'account-details-names-auctions',
            meta: {
              hideHeader: true,
              asModal: true,
            },
          },
          {
            path: 'claim',
            component: NameClaim,
            props: true,
            name: 'account-details-names-claim',
            meta: {
              hideHeader: true,
              asModal: true,
            },
          },
        ],
      },
    ],
  },
  {
    name: 'popup-sign-tx',
    path: '/popup-sign-tx',
    component: ConfirmTransactionSign,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: 'popup-raw-sign',
    path: '/popup-raw-sign',
    component: ConfirmRawSign,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: 'connect',
    path: '/connect',
    component: PopupConnect,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: 'message-sign',
    path: '/message-sign',
    component: PopupMessageSign,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    path: '/more/settings',
    name: 'settings',
    component: Settings,
    meta: {
      title: 'settings',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/reset-wallet',
    name: 'settings-reset-wallet',
    component: ResetWallet,
    meta: {
      title: 'reset-wallet',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/errors-log',
    name: 'settings-errors-log',
    component: ErrorLogSettings,
    meta: {
      title: 'save-errors-log',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/language',
    name: 'settings-language',
    component: LanguageSettings,
    meta: {
      title: 'language',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/currency',
    name: 'settings-currency',
    component: CurrencySettings,
    meta: {
      title: 'currency',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/seed-phrase',
    name: 'settings-seed-phrase',
    component: SeedPhraseSettings,
    meta: {
      title: 'seed-phrase',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/seed-phrase/details',
    name: 'settings-seed-phrase-details',
    component: SeedPhraseDetailsSettings,
    meta: {
      title: 'seed-phrase',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/seed-phrase/details/verify',
    name: 'settings-seed-phrase-verify',
    component: SeedPhraseVerifySettings,
    meta: {
      title: 'seed-phrase',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/networks',
    name: 'network-settings',
    component: Networks,
    props: true,
    meta: {
      title: 'networks',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/networks/add',
    name: 'network-add',
    component: NetworkForm,
    props: true,
    meta: {
      title: 'network-add',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/networks/edit/:name',
    name: 'network-edit',
    component: NetworkForm,
    props: true,
    meta: {
      title: 'network-edit',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/permissions',
    component: PermissionsSettings,
    name: 'permissions-settings',
    meta: {
      title: 'permissionsSettings',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/permissions/add',
    component: PermissionManager,
    name: 'permissions-add',
    meta: {
      title: 'permissionsAdd',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/permissions/:host',
    component: PermissionManager,
    name: 'permissions-details',
    meta: {
      title: 'permissionsEdit',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
      isEdit: true,
    },
  },
  {
    path: '/more/about',
    component: About,
    name: 'about',
    meta: {
      title: 'about',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/about/terms',
    component: TermsOfService,
    name: 'about-terms',
    meta: {
      title: 'terms',
      showBackButton: true,
      showCloseButton: true,
      showScrollbar: true,
      hideNotificationsIcon: true,
      ifNotAuth: true,
    },
  },
  {
    path: '/more/about/privacy',
    component: PrivacyPolicy,
    name: 'about-privacy',
    meta: {
      title: 'privacy',
      showBackButton: true,
      showCloseButton: true,
      showScrollbar: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/tips-claim',
    name: 'tips-claim',
    component: TipsClaim,
    meta: {
      title: 'claim-tips',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/tips*',
    redirect: '/account*',
  },
  {
    path: '/retip',
    component: Retip,
    meta: {
      title: 'send-tip',
      notPersist: true,
    },
  },
  {
    name: 'tx-details',
    path: '/transactions/:hash',
    component: TransactionDetails,
    props: true,
    meta: {
      title: 'tx-details',
      hideNotificationsIcon: true,
      showCloseButton: true,
    },
  },
  {
    path: '/more',
    component: More,
    name: 'more',
    meta: {
      title: 'more',
      showBackButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/invite',
    name: 'invite',
    component: Invite,
    meta: {
      title: 'invite',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/more/settings/notifications',
    name: 'notification-settings',
    component: NotificationSettings,
    meta: {
      title: 'notifications',
      showBackButton: true,
      showCloseButton: true,
      hideNotificationsIcon: true,
    },
  },
  {
    path: '/names/auctions/:name/',
    component: Auction,
    props: true,
    children: [
      {
        path: '',
        component: AuctionBid,
        props: true,
        name: 'auction-bid',
        meta: {
          title: 'auction',
          backRoute: { name: ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS },
        },
      },
      {
        path: 'history',
        component: AuctionHistory,
        props: true,
        name: 'auction-history',
        meta: {
          title: 'auction',
          backRoute: { name: ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS },
        },
      },
    ],
  },
  {
    path: '/comment',
    component: CommentNew,
    meta: {
      title: 'comment-new',
      notPersist: true,
    },
  },
  {
    name: 'donate-error',
    path: '/donate-error',
    component: DonateError,
    props: true,
    meta: {
      title: 'donate-error',
      notPersist: true,
      ifNotAuth: true,
    },
  },
  {
    name: 'address',
    path: '/address',
    component: Address,
    meta: {
      title: 'address',
      notPersist: true,
    },
  },
  {
    path: '/account-details/:type/:id',
    component: TokenContainer,
    children: [
      {
        name: 'token-details',
        path: 'details',
        component: TokenDetails,
        props: true,
        meta: {
          title: 'token-details',
          showBackButton: true,
          showCloseButton: true,
          hideNotificationsIcon: true,
          isModalHeader: true,
        },
      },
      {
        name: 'token-transactions',
        path: 'transactions',
        component: TokenTransactions,
        props: true,
        meta: {
          title: 'token-details',
          showBackButton: true,
          showCloseButton: true,
          hideNotificationsIcon: true,
          isModalHeader: true,
        },
      },
    ],
  },
  {
    name: 'sign-message',
    path: '/sign-message',
    component: SignMessage,
    meta: {
      title: 'sign-message',
      notPersist: true,
    },
  },
  {
    name: 'sign-transaction',
    path: '/sign-transaction',
    component: SignTransaction,
    meta: {
      title: 'sign-transaction',
      notPersist: true,
    },
  },
  {
    name: 'invite-claim',
    path: '/invite/:secretKey',
    component: InviteClaim,
    props: true,
    meta: {
      title: 'invite',
      notPersist: true,
    },
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: Notifications,
    meta: {
      title: 'notifications',
      notPersist: true,
    },
  },
  {
    name: 'not-found',
    path: '*',
    component: NotFound,
    meta: {
      ifNotAuth: true,
    },
  },
];
