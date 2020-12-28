import Index from '../pages/Index';
import Account from '../pages/Account';
import PopupSignTransaction from '../pages/Popups/SignTx';
import PopupConnect from '../pages/Popups/Connect';
import PopupAskAccounts from '../pages/Popups/AskAccounts';
import PopupMessageSign from '../pages/Popups/MessageSign';
import Settings from '../pages/Settings';
import LanguageSettings from '../pages/LanguageSettings';
import SecuritySettings from '../pages/SecuritySettings';
import About from '../pages/About';
import Tip from '../pages/Tip';
import Retip from '../pages/Retip';
import TermsOfService from '../pages/TermsOfService';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import ImportAccount from '../pages/ImportAccount';
import Intro from '../pages/Intro';
import Transactions from '../pages/Transactions';
import Send from '../pages/Send';
import Receive from '../pages/Receive';
import SuccessTip from '../pages/SuccessTip';
import Notifications from '../pages/Notifications';
import NotificationSettings from '../pages/NotificationSettings';

import PermissionsSettings from '../pages/PermissionsSettings';
import PermissionsDetails from '../pages/PermissionsDetails';
import Networks from '../pages/Networks';
import CommentNew from '../pages/CommentNew';
import NotFound from '../pages/NotFound';
import ClaimTips from '../pages/ClaimTips';
import DonateError from '../pages/DonateError';
import Address from '../pages/Address';
import TokensPreview from '../pages/FungibleTokens/TokensPreview';
import TokenDetails from '../pages/FungibleTokens/TokenDetails';
import SignMessage from '../pages/SignMessage';
import NamesList from '../pages/Names/List';
import NameClaim from '../pages/Names/Claim';
import NamesDetails from '../pages/Names/Details';
import AuctionList from '../pages/Names/AuctionList';
import AuctionDetails from '../pages/Names/AuctionDetails';
import AuctionBid from '../pages/Names/AuctionBid';
import Invite from '../pages/Invite';
import InviteClaim from '../pages/InviteClaim';

import webIframePopups from './web-iframe-popups';

export default [
  {
    path: '/',
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
    name: 'popup-sign-tx',
    path: '/popup-sign-tx',
    component: PopupSignTransaction,
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
    name: 'ask-accounts',
    path: '/ask-accounts',
    component: PopupAskAccounts,
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
    path: '/settings',
    component: Settings,
    meta: {
      title: 'settings',
    },
  },
  {
    path: '/settings/language',
    component: LanguageSettings,
    meta: {
      title: 'language',
    },
  },
  {
    path: '/settings/security',
    name: 'settings-security',
    component: SecuritySettings,
    meta: {
      title: 'security',
    },
  },
  {
    path: '/settings/networks',
    component: Networks,
    props: true,
    meta: {
      title: 'networks',
    },
  },
  {
    path: '/settings/permissions',
    component: PermissionsSettings,
    name: 'permissions-settings',
    meta: {
      title: 'permissionsSettings',
    },
  },
  {
    path: '/settings/permissions/:host',
    component: PermissionsDetails,
    name: 'permissions-details',
    meta: {
      title: 'permissionsDetails',
    },
  },
  {
    path: '/about',
    component: About,
    meta: {
      title: 'about',
      ifNotAuth: true,
    },
  },
  {
    path: '/about/termsOfService',
    component: TermsOfService,
    meta: {
      title: 'terms',
      ifNotAuth: true,
    },
  },
  {
    path: '/about/privacyPolicy',
    component: PrivacyPolicy,
    meta: {
      title: 'privacy',
    },
  },
  {
    path: '/tip',
    name: 'tip',
    component: Tip,
    meta: {
      title: 'send-tips',
    },
  },
  {
    path: '/retip',
    component: Retip,
    meta: {
      title: 'send-tips',
      notPersist: true,
    },
  },
  {
    path: '/claim-tips',
    name: 'claim-tips',
    component: ClaimTips,
    meta: {
      title: 'claim-tips',
    },
  },
  {
    path: '/import-account',
    component: ImportAccount,
    meta: {
      title: 'importAccount',
      ifNotAuthOnly: true,
    },
  },
  {
    path: '/intro',
    component: Intro,
    meta: {
      ifNotAuthOnly: true,
      notPersist: true,
    },
  },

  {
    path: '/transactions',
    component: Transactions,
    meta: {
      title: 'activity',
    },
  },
  {
    path: '/send',
    name: 'send',
    props: true,
    component: Send,
    meta: {
      title: 'send',
    },
  },
  {
    path: '/receive',
    component: Receive,
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
    },
  },
  {
    path: '/names',
    component: NamesList,
    props: true,
    name: 'name-list',
    meta: {
      title: 'names',
    },
  },
  {
    path: '/names/claim',
    component: NameClaim,
    props: true,
    name: 'name-claim',
    meta: {
      title: 'names',
    },
  },
  {
    path: '/names/auctions',
    component: AuctionList,
    props: true,
    name: 'auction-list',
    meta: {
      title: 'names',
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
    },
  },
  {
    path: '/names/auctions/:name/bid',
    component: AuctionBid,
    props: true,
    name: 'auction-bid',
    meta: {
      title: 'names',
    },
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
    name: 'tokens-preview',
    path: '/tokens',
    component: TokensPreview,
    meta: {
      title: 'tokens-preview',
    },
  },
  {
    name: 'token-details',
    path: '/tokens/:id',
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
    },
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
    name: 'invite',
    path: '/invite',
    component: Invite,
    meta: {
      title: 'invite',
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
  ...webIframePopups,
];
