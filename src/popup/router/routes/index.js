import ConfirmTransactionSign from '../components/Modals/ConfirmTransactionSign';
import ConfirmRawSign from '../components/Modals/ConfirmRawSign';
import About from '../pages/About';
import Account from '../pages/Account';
import Accounts from '../pages/Accounts';
import Address from '../pages/Address';
import CommentNew from '../pages/CommentNew';
import DonateError from '../pages/DonateError';
import TokenDetails from '../pages/FungibleTokens/TokenDetails';
import Balances from '../pages/FungibleTokens/Balances';
import ImportAccount from '../pages/ImportAccount';
import Index from '../pages/Index';
import Intro from '../pages/Intro';
import Invite from '../pages/Invite';
import InviteClaim from '../pages/InviteClaim';
import LanguageSettings from '../pages/LanguageSettings';
import Auction from '../pages/Names/Auction';
import AuctionBid from '../pages/Names/AuctionBid';
import AuctionHistory from '../pages/Names/AuctionHistory';
import AuctionList from '../pages/Names/AuctionList';
import More from '../pages/More';
import Names from '../pages/Names/Names';
import NameClaim from '../pages/Names/Claim';
import NamesList from '../pages/Names/List';
import Networks from '../pages/Networks';
import NotFound from '../pages/NotFound';
import Notifications from '../pages/Notifications';
import NotificationSettings from '../pages/NotificationSettings';
import PermissionsDetails from '../pages/PermissionsDetails';
import PermissionsSettings from '../pages/PermissionsSettings';
import PopupConnect from '../pages/Popups/Connect';
import PopupMessageSign from '../pages/Popups/MessageSign';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import Retip from '../pages/Retip';
import SecuritySettings from '../pages/SecuritySettings';
import Transfer from '../pages/Transfer';
import TransferSend from '../pages/TransferSend';
import TransferReceive from '../pages/TransferReceive';
import Settings from '../pages/Settings';
import SignMessage from '../pages/SignMessage';
import SuccessTip from '../pages/SuccessTip';
import TermsOfService from '../pages/TermsOfService';
import Tips from '../pages/Tips';
import TipsSend from '../pages/TipsSend';
import TipsClaim from '../pages/TipsClaim';
import TransactionDetails from '../pages/TransactionDetails';
import Transactions from '../pages/Transactions';
import webIframePopups from './web-iframe-popups';

export default [
  {
    path: '/',
    name: 'index',
    component: Index,
    meta: {
      title: '',
      navigation: false,
      ifNotAuthOnly: true,
      notPersist: true,
    },
  },
  {
    path: '/account',
    name: 'account',
    component: Account,
  },
  {
    path: '/accounts',
    name: 'accounts',
    component: Accounts,
    meta: {
      title: 'accounts',
    },
  },
  {
    name: 'popup-sign-tx',
    path: '/popup-sign-tx',
    component: ConfirmTransactionSign,
    props: true,
    meta: {
      notPersist: true,
      hideTabBar: true,
    },
  },
  {
    name: 'popup-raw-sign',
    path: '/popup-raw-sign',
    component: ConfirmRawSign,
    props: true,
    meta: {
      notPersist: true,
      hideTabBar: true,
    },
  },
  {
    name: 'connect',
    path: '/connect',
    component: PopupConnect,
    props: true,
    meta: {
      notPersist: true,
      hideTabBar: true,
    },
  },
  {
    name: 'message-sign',
    path: '/message-sign',
    component: PopupMessageSign,
    props: true,
    meta: {
      notPersist: true,
      hideTabBar: true,
    },
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: {
      title: 'settings',
      notRebrand: true,
    },
  },
  {
    path: '/settings/language',
    component: LanguageSettings,
    meta: {
      title: 'language',
      notRebrand: true,
    },
  },
  {
    path: '/settings/security',
    name: 'settings-security',
    component: SecuritySettings,
    meta: {
      title: 'security',
      notRebrand: true,
    },
  },
  {
    path: '/settings/networks',
    component: Networks,
    props: true,
    meta: {
      title: 'networks',
      notRebrand: true,
    },
  },
  {
    path: '/settings/permissions',
    component: PermissionsSettings,
    name: 'permissions-settings',
    meta: {
      title: 'permissionsSettings',
      notRebrand: true,
    },
  },
  {
    path: '/settings/permissions/:host',
    component: PermissionsDetails,
    name: 'permissions-details',
    meta: {
      title: 'permissionsDetails',
      notRebrand: true,
    },
  },
  {
    path: '/about',
    component: About,
    meta: {
      title: 'about',
      ifNotAuth: true,
      notRebrand: true,
    },
  },
  {
    path: '/about/termsOfService',
    component: TermsOfService,
    meta: {
      title: 'terms',
      ifNotAuth: true,
      notRebrand: true,
    },
  },
  {
    path: '/about/privacyPolicy',
    component: PrivacyPolicy,
    meta: {
      title: 'privacy',
      ifNotAuth: true,
      notRebrand: true,
    },
  },
  {
    path: '/tips',
    component: Tips,
    children: [{
      path: '',
      name: 'tips-send',
      component: TipsSend,
      props: true,
      meta: {
        title: 'tips',
        notRebrand: true,
        backButton: false,
      },
    }, {
      path: 'claim',
      name: 'tips-claim',
      component: TipsClaim,
      meta: {
        title: 'tips',
        notRebrand: true,
        backButton: false,
      },
    }],
  },
  {
    path: '/tip',
    redirect: '/tips',
  },
  {
    path: '/retip',
    component: Retip,
    meta: {
      title: 'send-tip',
      notPersist: true,
      notRebrand: true,
    },
  },
  {
    path: '/import-account',
    component: ImportAccount,
    meta: {
      title: 'importAccount',
      ifNotAuthOnly: true,
      notRebrand: true,
    },
  },
  {
    path: '/intro',
    component: Intro,
    meta: {
      ifNotAuthOnly: true,
      notPersist: true,
      notRebrand: true,
    },
  },

  {
    path: '/transactions',
    component: Transactions,
    meta: {
      title: 'activity',
      notRebrand: true,
    },
  },
  {
    name: 'tx-details',
    path: '/transactions/:hash',
    component: TransactionDetails,
    props: true,
    meta: {
      title: 'tx-details',
      hideTabBar: true,
    },
  },
  {
    path: '/transfer',
    component: Transfer,
    children: [{
      path: '',
      name: 'transfer-send',
      component: TransferSend,
      props: true,
      meta: {
        title: 'transfer',
        notRebrand: true,
        backButton: false,
      },
    }, {
      path: 'receive',
      name: 'transfer-receive',
      component: TransferReceive,
      meta: {
        title: 'transfer',
        notRebrand: true,
        backButton: false,
      },
    }],
  },
  {
    path: '/success-tip',
    component: SuccessTip,
    name: 'success-tip',
    props: true,
    meta: {
      title: 'send',
      notPersist: true,
      notRebrand: true,
    },
  },
  {
    path: '/more',
    component: More,
    name: 'more',
    meta: {
      title: 'more',
      backButton: false,
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
    path: '/notifications/settings',
    name: 'notification-settings',
    component: NotificationSettings,
    meta: {
      title: 'notification-settings',
      notPersist: true,
      notRebrand: true,
    },
  },
  {
    path: '/names',
    component: Names,
    props: true,
    children: [{
      path: '',
      name: 'name-list',
      component: NamesList,
      props: true,
      meta: {
        title: 'names',
        backButton: false,
      },
    }, {
      path: 'auctions',
      component: AuctionList,
      props: true,
      name: 'auction-list',
      meta: {
        title: 'name-auctions',
        backButton: false,
      },
    }, {
      path: 'claim',
      component: NameClaim,
      props: true,
      name: 'name-claim',
      meta: {
        title: 'register-name',
        backButton: false,
      },
    }],
  },
  {
    path: '/names/auctions/:name/',
    component: Auction,
    props: true,
    children: [{
      path: '',
      component: AuctionBid,
      props: true,
      name: 'auction-bid',
      meta: {
        title: 'auction',
        hideTabBar: true,
      },
    }, {
      path: 'history',
      component: AuctionHistory,
      props: true,
      name: 'auction-history',
      meta: {
        title: 'auction',
        hideTabBar: true,
      },
    }],
  },
  {
    path: '/comment',
    component: CommentNew,
    meta: {
      title: 'comment-new',
      notPersist: true,
      notRebrand: true,
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
      notRebrand: true,
    },
  },
  {
    name: 'address',
    path: '/address',
    component: Address,
    meta: {
      title: 'address',
      notPersist: true,
      notRebrand: true,
    },
  },
  {
    name: 'balances',
    path: '/balances',
    component: Balances,
    meta: {
      title: 'balances',
      backButton: false,
    },
  },
  {
    name: 'token-details',
    path: '/balances/:id',
    component: TokenDetails,
    props: true,
    meta: {
      title: 'token-details',
    },
  },
  {
    name: 'not-found',
    path: '*',
    component: NotFound,
    meta: {
      ifNotAuth: true,
      notRebrand: true,
    },
  },
  {
    name: 'sign-message',
    path: '/sign-message',
    component: SignMessage,
    meta: {
      title: 'sign-message',
      notPersist: true,
      notRebrand: true,
    },
  },
  {
    name: 'invite',
    path: '/invite',
    component: Invite,
    meta: {
      title: 'invite',
      notRebrand: true,
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
      notRebrand: true,
    },
  },
  ...webIframePopups,
];
