import IndexComponent from './pages/Index';
import AccountComponent from './pages/Account';
import PopupSignTransactionComponent from './pages/Popups/PopupSignTx';
import PopupConnectComponent from './pages/Popups/PopupConnect';
import PopupAskAccountsComponent from './pages/Popups/PopupAskAccounts';
import PopupMessageSignComponent from './pages/Popups/PopupMessageSign';
import SignTransactionComponent from './pages/SignTransaction';
import SettingsComponent from './pages/Settings';
import GeneralSettingsComponent from './pages/GeneralSettings';
import SecuritySettingsComponent from './pages/SecuritySettings';
import AboutSettingsComponent from './pages/AboutSettings';
import TipComponent from './pages/TipPage';
import Retip from './pages/Retip';
import QrCodeReader from './pages/QrCodeReader';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ImportAccount from './pages/ImportAccount';
import IntroComponent from './pages/Intro';
import TransactionsComponent from './pages/Transactions';
import SendComponent from './pages/Send';
import ReceiveComponent from './pages/Receive';
import SuccessTip from './pages/SuccessTip';
import NotificationsPage from './pages/Notifications';
import NamesPage from './pages/Names';
import AuctionBid from './pages/AuctionBid';
import Networks from './pages/Networks';
import NotFound from './pages/NotFound';

export default [
  {
    path: '/',
    component: IndexComponent,
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
    component: AccountComponent,
  },
  {
    name: 'sign',
    path: '/sign-transaction/:type?',
    component: SignTransactionComponent,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: 'popup-sign-tx',
    path: '/popup-sign-tx',
    component: PopupSignTransactionComponent,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: 'connect',
    path: '/connect',
    component: PopupConnectComponent,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: 'ask-accounts',
    path: '/ask-accounts',
    component: PopupAskAccountsComponent,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    name: 'message-sign',
    path: '/message-sign',
    component: PopupMessageSignComponent,
    props: true,
    meta: {
      notPersist: true,
    },
  },
  {
    path: '/settings',
    component: SettingsComponent,
    meta: {
      title: 'settings',
    },
  },
  {
    path: '/generalSettings',
    component: GeneralSettingsComponent,
    meta: {
      title: 'general',
    },
  },
  {
    path: '/securitySettings',
    component: SecuritySettingsComponent,
    meta: {
      title: 'security',
    },
  },
  {
    path: '/aboutSettings',
    component: AboutSettingsComponent,
    meta: {
      title: 'about',
    },
  },
  {
    path: '/tip',
    component: TipComponent,
    meta: {
      title: 'send',
    },
  },
  {
    path: '/retip',
    component: Retip,
    meta: {
      title: 'send',
    },
  },
  {
    path: '/qrCodeReader',
    name: 'qrCodeReader',
    props: true,
    component: QrCodeReader,
    meta: {
      title: 'scanQr',
      notPersist: true,
    },
  },
  {
    path: '/termsOfService',
    component: TermsOfService,
    meta: {
      title: 'terms',
      ifNotAuth: true,
    },
  },
  {
    path: '/privacyPolicy',
    component: PrivacyPolicy,
    meta: {
      title: 'privacy',
    },
  },
  {
    path: '/importAccount',
    component: ImportAccount,
    meta: {
      title: 'importAccount',
      ifNotAuthOnly: true,
    },
  },
  {
    path: '/intro',
    component: IntroComponent,
    meta: {
      ifNotAuthOnly: true,
      notPersist: true,
    },
  },

  {
    path: '/transactions',
    component: TransactionsComponent,
    meta: {
      title: 'activity',
    },
  },
  {
    path: '/send',
    name: 'send',
    props: true,
    component: SendComponent,
    meta: {
      title: 'withdraw',
    },
  },
  {
    path: '/receive',
    component: ReceiveComponent,
    meta: {
      title: 'topUp',
    },
  },
  {
    path: '/success-tip',
    component: SuccessTip,
    name: 'success-tip',
    props: true,
    meta: {
      title: 'send',
      notPersist: true,
    },
  },
  {
    path: '/notifications',
    component: NotificationsPage,
    meta: {
      title: 'notifications',
      notPersist: true,
    },
  },
  {
    path: '/names',
    component: NamesPage,
    meta: {
      title: 'names',
    },
  },
  {
    name: 'auction-bid',
    path: '/auction-bid',
    component: AuctionBid,
    props: true,
    meta: {
      title: 'bidding',
      notPersist: true,
    },
  },
  {
    path: '/networks',
    component: Networks,
    props: true,
    meta: {
      title: 'networks',
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
