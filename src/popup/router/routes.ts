import type { WalletAppRouteConfig } from '@/types';
import {
  PROTOCOL_VIEW_ACCOUNT_DETAILS,
  PROTOCOL_VIEW_ACCOUNT_DETAILS_TRANSACTIONS,
  PROTOCOL_VIEW_TRANSACTION_DETAILS,
} from '@/constants';
import {
  ROUTE_INDEX,
  ROUTE_ACCOUNT,
  ROUTE_ACCOUNT_DETAILS,
  ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS,
  ROUTE_ACCOUNT_DETAILS_TRANSACTIONS,
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
  ROUTE_MULTISIG_DETAILS_TRANSACTIONS,
  ROUTE_MULTISIG_TX_DETAILS,
  ROUTE_TX_DETAILS,
  ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS,
  ROUTE_MULTISIG_COIN,
  ROUTE_MULTISIG_COIN_DETAILS,
  ROUTE_COIN_DETAILS,
  ROUTE_TOKEN_DETAILS,
  ROUTE_NETWORK_ADD,
  ROUTE_NETWORK_EDIT,
  ROUTE_INVITE_CLAIM,
  ROUTE_DONATE_ERROR,
  ROUTE_APPS_BROWSER,
} from './routeNames';

import About from '../pages/About.vue';
import AccountDetailsMultisig from '../pages/AccountDetailsMultisig.vue';
import AccountDetailsMultisigTokens from '../pages/AccountDetailsMultisigTokens.vue';
import AccountDetailsMultisigTransactions from '../pages/AccountDetailsMultisigTransactions.vue';
import AccountDetailsTokens from '../pages/AccountDetailsTokens.vue';
import AccountDetailsNames from '../pages/AccountDetailsNames.vue';
import Address from '../pages/Address.vue';
import Dashboard from '../pages/Dashboard.vue';
import DashboardMultisig from '../pages/DashboardMultisig.vue';
import CommentNew from '../pages/CommentNew.vue';
import ConfirmTransactionSign from '../components/Modals/ConfirmTransactionSign.vue';
import ConfirmRawSign from '../components/Modals/ConfirmRawSign.vue';
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
import NamesList from '../pages/Names/NamesList.vue';
import NotFound from '../pages/NotFound.vue';
import Notifications from '../pages/Notifications.vue';
import NotificationSettings from '../pages/NotificationSettings.vue';
import ErrorLogSettings from '../pages/ErrorLogSettings.vue';
import PermissionsSettings from '../pages/PermissionsSettings.vue';
import PermissionManager from '../pages/PermissionManager.vue';
import PopupConnect from '../pages/Popups/Connect.vue';
import PopupAccountList from '../pages/Popups/AccountList.vue';
import PopupMessageSign from '../pages/Popups/MessageSign.vue';
import PrivacyPolicy from '../pages/PrivacyPolicy.vue';
import ProtocolSpecificView from '../components/ProtocolSpecificView.vue';
import Retip from '../pages/Retip.vue';
import SeedPhraseSettings from '../pages/SeedPhraseSettings.vue';
import SeedPhraseDetailsSettings from '../pages/SeedPhraseDetailsSettings.vue';
import SeedPhraseVerifySettings from '../pages/SeedPhraseVerifySettings.vue';
import Settings from '../pages/Settings.vue';
import SignMessage from '../pages/SignMessage.vue';
import SignTransaction from '../pages/SignTransaction.vue';
import TermsOfService from '../pages/TermsOfService.vue';
import TipsClaim from '../pages/TipsClaim.vue';
import MultisigProposalDetails from '../pages/MultisigProposalDetails.vue';
import ResetWallet from '../pages/ResetWallet.vue';
import webIframePopups from './webIframePopups';
import Networks from '../pages/Networks.vue';
import NetworkForm from '../pages/NetworkForm.vue';
import MultisigDetails from '../pages/MultisigDetails.vue';
import DefaultPagesRouter from '../components/DefaultPagesRouter.vue';
import AppsBrowser from '../pages/AppsBrowser.vue';

import TransactionDetails from '../../protocols/aeternity/views/TransactionDetails.vue';

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
    path: '/',
    component: DefaultPagesRouter,
    redirect: { name: ROUTE_ACCOUNT },
    children: [
      {
        path: 'account',
        name: ROUTE_ACCOUNT,
        component: Dashboard,
      },
      {
        path: 'account-details/',
        component: ProtocolSpecificView,
        props: { viewComponentName: PROTOCOL_VIEW_ACCOUNT_DETAILS },
        children: [
          {
            path: '',
            name: ROUTE_ACCOUNT_DETAILS,
            component: AccountDetailsTokens,
            meta: {
              showFilterBar: true,
              hideHeader: true,
              hideFilterButton: true,
            },
          },
          {
            path: 'transactions',
            name: ROUTE_ACCOUNT_DETAILS_TRANSACTIONS,
            component: ProtocolSpecificView,
            props: { viewComponentName: PROTOCOL_VIEW_ACCOUNT_DETAILS_TRANSACTIONS },
            meta: {
              hideHeader: true,
              showFilterBar: true,
            },
          },
          {
            path: 'names',
            component: AccountDetailsNames,
            children: [
              {
                path: '',
                name: ROUTE_ACCOUNT_DETAILS_NAMES,
                component: NamesList,
                props: true,
                meta: {
                  hideHeader: true,
                },
              },
              {
                path: 'auctions',
                component: AuctionList,
                props: true,
                name: ROUTE_ACCOUNT_DETAILS_NAMES_AUCTIONS,
                meta: {
                  hideHeader: true,
                },
              },
              {
                path: 'claim',
                component: NameClaim,
                props: true,
                name: ROUTE_ACCOUNT_DETAILS_NAMES_CLAIM,
                meta: {
                  hideHeader: true,
                },
              },
            ],
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
      title: 'tx-details',
      showHeaderNavigation: true,
      backRoute: { name: ROUTE_ACCOUNT_DETAILS_TRANSACTIONS },
    },
  },
  {
    path: '/multisig',
    component: DefaultPagesRouter,
    meta: {
      isMultisig: true,
    },
    children: [
      {
        path: '',
        name: ROUTE_MULTISIG_ACCOUNT,
        component: DashboardMultisig,
      },
      {
        path: 'details/',
        component: AccountDetailsMultisig,
        children: [
          {
            path: '',
            name: ROUTE_MULTISIG_DETAILS,
            component: AccountDetailsMultisigTokens,
            meta: {
              showFilterBar: true,
              hideHeader: true,
              hideFilterButton: true,
            },
          },
          {
            path: 'transactions',
            name: ROUTE_MULTISIG_DETAILS_TRANSACTIONS,
            component: AccountDetailsMultisigTransactions,
            meta: {
              hideHeader: true,
              showFilterBar: true,
            },
          },
          {
            path: 'info',
            name: ROUTE_MULTISIG_DETAILS_INFO,
            component: MultisigDetails,
            meta: {
              hideHeader: true,
            },
          },
        ],
      },

      {
        path: 'details/transactions/:hash/:transactionOwner',
        name: ROUTE_MULTISIG_TX_DETAILS,
        component: TransactionDetails,
        props: { multisigDashboard: true },
        meta: {
          title: 'txDetails',
          showHeaderNavigation: true,
          backRoute: { name: ROUTE_MULTISIG_DETAILS_TRANSACTIONS },
        },
      },
      {
        path: 'details/multisig-proposals',
        name: ROUTE_MULTISIG_DETAILS_PROPOSAL_DETAILS,
        component: MultisigProposalDetails,
        props: true,
        meta: {
          title: 'multisigProposalDetails',
          backRoute: { name: ROUTE_MULTISIG_DETAILS_TRANSACTIONS },
          showHeaderNavigation: true,
        },
      },
      {
        path: 'coins/:id',
        component: TokenContainer,
        children: [
          {
            name: ROUTE_MULTISIG_COIN,
            path: '',
            component: TokenTransactions,
            props: true,
            meta: {
              title: 'coinDetails',
              backRoute: { name: ROUTE_MULTISIG_DETAILS },
              showHeaderNavigation: true,
              showFilterBar: true,
              hideSearchBar: true,
              isMultisig: true,
            },
          },
          {
            name: ROUTE_MULTISIG_COIN_DETAILS,
            path: 'details',
            component: TokenDetails,
            props: true,
            meta: {
              title: 'coinDetails',
              backRoute: { name: ROUTE_MULTISIG_DETAILS },
              showHeaderNavigation: true,
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
    name: 'account-list',
    path: '/account-list',
    component: PopupAccountList,
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
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/reset-wallet',
    name: 'settings-reset-wallet',
    component: ResetWallet,
    meta: {
      title: 'resetWallet',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/errors-log',
    name: 'settings-errors-log',
    component: ErrorLogSettings,
    meta: {
      title: 'saveErrorsLog',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/language',
    name: 'settings-language',
    component: LanguageSettings,
    meta: {
      title: 'language',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/currency',
    name: 'settings-currency',
    component: CurrencySettings,
    meta: {
      title: 'currency',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/seed-phrase',
    name: 'settings-seed-phrase',
    component: SeedPhraseSettings,
    meta: {
      title: 'seedPhrase',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/seed-phrase/details',
    name: 'settings-seed-phrase-details',
    component: SeedPhraseDetailsSettings,
    meta: {
      title: 'seedPhrase',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/seed-phrase/details/verify',
    name: 'settings-seed-phrase-verify',
    component: SeedPhraseVerifySettings,
    meta: {
      title: 'seedPhrase',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/networks',
    name: ROUTE_NETWORK_SETTINGS,
    component: Networks,
    props: true,
    meta: {
      title: 'networks',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/networks/add',
    name: ROUTE_NETWORK_ADD,
    component: NetworkForm,
    props: true,
    meta: {
      title: 'networkAdd',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/networks/:name',
    name: ROUTE_NETWORK_EDIT,
    component: NetworkForm,
    props: true,
    meta: {
      title: 'networkEdit',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/permissions',
    component: PermissionsSettings,
    name: 'permissions-settings',
    meta: {
      title: 'permissionsSettings',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/permissions/add',
    component: PermissionManager,
    name: 'permissions-add',
    meta: {
      title: 'permissionsAdd',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/permissions/:host',
    component: PermissionManager,
    name: 'permissions-details',
    meta: {
      title: 'permissionsEdit',
      showHeaderNavigation: true,
      isEdit: true,
    },
  },
  {
    path: '/more/about',
    component: About,
    name: 'about',
    meta: {
      title: 'about',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/about/terms',
    component: TermsOfService,
    name: 'about-terms',
    meta: {
      title: 'terms',
      showHeaderNavigation: true,
      showScrollbar: true,
      ifNotAuth: true,
      directBackRoute: true,
    },
  },
  {
    path: '/more/about/privacy',
    component: PrivacyPolicy,
    name: 'about-privacy',
    meta: {
      title: 'privacy',
      ifNotAuth: true,
      showHeaderNavigation: true,
      showScrollbar: true,
    },
  },
  {
    path: '/more/tips-claim',
    name: 'tips-claim',
    component: TipsClaim,
    meta: {
      title: 'claimTips',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/tips',
    redirect: '/account',
  },
  {
    path: '/retip',
    component: Retip,
    meta: {
      title: 'sendTip',
      notPersist: true,
    },
  },
  {
    path: '/more',
    component: More,
    name: 'more',
    meta: {
      title: 'more',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/invite',
    name: 'invite',
    component: Invite,
    meta: {
      title: 'invite',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/more/settings/notifications',
    name: 'notification-settings',
    component: NotificationSettings,
    meta: {
      title: 'notifications',
      showHeaderNavigation: true,
    },
  },
  {
    path: '/account-details/names/auctions/:name/',
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
          showHeaderNavigation: true,
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
          showHeaderNavigation: true,
        },
      },
    ],
  },
  {
    path: '/comment',
    component: CommentNew,
    meta: {
      title: 'commentNew',
      notPersist: true,
      showHeaderNavigation: true,
    },
  },
  {
    name: ROUTE_DONATE_ERROR,
    path: '/donate-error',
    component: DonateError,
    props: true,
    meta: {
      title: 'donateError',
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
    path: '/coins/:id',
    component: TokenContainer,
    children: [
      {
        name: ROUTE_COIN,
        path: '',
        component: TokenTransactions,
        props: true,
        meta: {
          title: 'coinDetails',
          backRoute: { name: ROUTE_ACCOUNT_DETAILS },
          showHeaderNavigation: true,
          showFilterBar: true,
          hideSearchBar: true,
        },
      },
      {
        name: ROUTE_COIN_DETAILS,
        path: 'details',
        component: TokenDetails,
        props: true,
        meta: {
          title: 'coinDetails',
          backRoute: { name: ROUTE_ACCOUNT_DETAILS },
          showHeaderNavigation: true,
        },
      },
    ],
  },
  {
    path: '/tokens/:id',
    component: TokenContainer,
    children: [
      {
        name: ROUTE_TOKEN,
        path: '',
        component: TokenTransactions,
        props: true,
        meta: {
          title: 'tokenDetails',
          backRoute: { name: ROUTE_ACCOUNT_DETAILS },
          showHeaderNavigation: true,
          showFilterBar: true,
          hideSearchBar: true,
        },
      },
      {
        name: ROUTE_TOKEN_DETAILS,
        path: 'details',
        component: TokenDetails,
        props: true,
        meta: {
          title: 'tokenDetails',
          backRoute: { name: ROUTE_ACCOUNT_DETAILS },
          showHeaderNavigation: true,
        },
      },
    ],
  },
  {
    name: 'sign-message',
    path: '/sign-message',
    component: SignMessage,
    meta: {
      title: 'signMessage',
      notPersist: true,
    },
  },
  {
    name: 'sign-transaction',
    path: '/sign-transaction',
    component: SignTransaction,
    meta: {
      title: 'signTransaction',
      notPersist: true,
    },
  },
  {
    name: ROUTE_APPS_BROWSER,
    path: '/apps-browser',
    component: AppsBrowser,
    meta: {
      title: 'appsBrowser',
      hideHeader: true,
      notPersist: true,
    },
  },
  {
    name: ROUTE_INVITE_CLAIM,
    path: '/invite/:secretKey?',
    component: InviteClaim,
    props: true,
    meta: {
      title: 'invite',
      notPersist: true,
    },
  },
  {
    path: '/notifications',
    name: ROUTE_NOTIFICATIONS,
    component: Notifications,
    meta: {
      title: 'notifications',
      showHeaderNavigation: true,
      notPersist: true,
    },
  },
  {
    name: ROUTE_NOT_FOUND,
    path: '/:pathMatch(.*)*',
    component: NotFound,
    props: true,
    meta: {
      ifNotAuth: true,
      notPersist: true,
      showHeaderNavigation: true,
      title: 'notFound',
    },
  },
];
