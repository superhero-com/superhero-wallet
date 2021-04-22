import ConfirmTransactionSign from '../components/Modals/ConfirmTransactionSign';
import About from '../pages/About';
import Account from '../pages/Account';
import Accounts from '../pages/Accounts';
import Address from '../pages/Address';
import CommentNew from '../pages/CommentNew';
import DonateError from '../pages/DonateError';
import TokenDetails from '../pages/FungibleTokens/TokenDetails';
import TokensPreview from '../pages/FungibleTokens/TokensPreview';
import ImportAccount from '../pages/ImportAccount';
import Index from '../pages/Index';
import Intro from '../pages/Intro';
import Invite from '../pages/Invite';
import InviteClaim from '../pages/InviteClaim';
import LanguageSettings from '../pages/LanguageSettings';
import AuctionBid from '../pages/Names/AuctionBid';
import AuctionDetails from '../pages/Names/AuctionDetails';
import AuctionList from '../pages/Names/AuctionList';
import NameClaim from '../pages/Names/Claim';
import NamesDetails from '../pages/Names/Details';
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
import Payments from '../pages/Payments';
import PaymentsSend from '../pages/PaymentsSend';
import PaymentsReceive from '../pages/PaymentsReceive';
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
    name: 'connect',
    path: '/connect',
    component: PopupConnect,
    props: true,
    meta: {
      notPersist: true,
      notRebrand: true,
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
      notRebrand: true,
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
    meta: {
      title: 'tips',
    },
    children: [{
      path: '',
      name: 'tips-send',
      component: TipsSend,
      meta: {
        notRebrand: true,
      },
    }, {
      path: 'claim',
      name: 'tips-claim',
      component: TipsClaim,
      meta: {
        notRebrand: true,
      },
    }],
  },
  {
    path: '/retip',
    component: Retip,
    meta: {
      title: 'send-tips',
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
    },
  },
  {
    path: '/payments',
    component: Payments,
    meta: {
      title: 'payments',
    },
    children: [{
      path: '',
      name: 'payments-send',
      component: PaymentsSend,
      meta: {
        notRebrand: true,
      },
    }, {
      path: 'receive',
      name: 'payments-receive',
      component: PaymentsReceive,
      meta: {
        notRebrand: true,
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
    component: NamesList,
    props: true,
    name: 'name-list',
    meta: {
      title: 'names',
      notRebrand: true,
    },
  },
  {
    path: '/names/claim',
    component: NameClaim,
    props: true,
    name: 'name-claim',
    meta: {
      title: 'names',
      notRebrand: true,
    },
  },
  {
    path: '/names/auctions',
    component: AuctionList,
    props: true,
    name: 'auction-list',
    meta: {
      title: 'names',
      notRebrand: true,
    },
  },
  {
    path: '/names/:name',
    component: NamesDetails,
    props: true,
    name: 'name-details',
    meta: {
      title: 'names',
      notPersist: true,
      notRebrand: true,
    },
  },
  {
    name: 'auction-details',
    path: '/names/auctions/:name',
    component: AuctionDetails,
    props: true,
    meta: {
      title: 'bidding',
      notPersist: true,
      notRebrand: true,
    },
  },
  {
    path: '/names/auctions/:name/bid',
    component: AuctionBid,
    props: true,
    name: 'auction-bid',
    meta: {
      title: 'names',
      notRebrand: true,
    },
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
    name: 'tokens-preview',
    path: '/tokens',
    component: TokensPreview,
    meta: {
      title: 'tokens-preview',
      notRebrand: true,
    },
  },
  {
    name: 'token-details',
    path: '/tokens/:id',
    component: TokenDetails,
    props: true,
    meta: {
      title: 'token-details',
      notRebrand: true,
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
