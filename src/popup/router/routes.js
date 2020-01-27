import IndexComponent from './pages/Index';
import AccountComponent from './pages/Account';
import SendComponent from './pages/Send';
import ReceiveComponent from './pages/Receive';
import AccountPasswordComponent from './pages/AccountPassword';
import SeedPhraseComponent from './pages/SeedPhrase';
import TransactionsComponent from './pages/Transactions';
import TransactionDetailsComponent from './pages/TransactionDetails';
import SignTransactionComponent from './pages/SignTransaction';
import PopupSignTransactionComponent from './pages/Popups/PopupSignTx';
import PopupConnectComponent from './pages/Popups/PopupConnect';
import ManageAccountComponent from './pages/ManageAccounts';
import SettingsComponent from './pages/Settings';
import GeneralSettingsComponent from './pages/GeneralSettings';
import SecuritySettingsComponent from './pages/SecuritySettings';
import AdvancedSettingsComponent from './pages/AdvancedSettings';
import AboutSettingsComponent from './pages/AboutSettings';
import UtilitiesComponent from './pages/Utilities';
import TipComponent from './pages/TipPage';
import AllowancesComponent from './pages/Allowances';
import ConnectConfirmComponent from './pages/ConnectConfirm';
import ManageNetworksComponent from './pages/ManageNetworks';
import FungibleTokensComponent from './pages/AddFungibleToken';
import SignAndVerifyMsg from './pages/SignAndVerifyMsg';
import FungibleTokensPageComponent from './pages/FungibleTokensPage';
import AensComponent from './pages/NamingSystem';
import AuctionBid from './pages/AuctionBid';
import MintFungibleTokenComponent from './pages/MintFungibleToken';
import AirGapSetup from './pages/AirGapSetup';
import SignTransactionByQrCode from './pages/SignTransactionByQrCode';
import QrCodeReader from './pages/QrCodeReader';
import CreateFungibleTokenComponent from './pages/CreateFungibleToken';
import LedgerSetupComponent from './pages/LedgerSetup';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TokenMigration from './pages/TokenMigration';
import TokenMigrationInfo from './pages/TokenMigrationInfo';
export default [
  {
    path: '/',
    component: IndexComponent,
  },
  {
    path: '/account',
    component: AccountComponent,
  },
  {
    path: '/send',
    name: 'send',
    props:true,
    component: SendComponent,
  },
  {
    path: '/receive',
    component: ReceiveComponent,
  },
  {
    name: 'password',
    path: '/password',
    component: AccountPasswordComponent,
    props:true
  },
  {
    name:'seed',
    path:'/seed',
    component:SeedPhraseComponent,
    props:true
  },
  {
    path:'/transactions',
    component:TransactionsComponent
  },
  {
    name:'transaction-details',
    path:'/transaction-details',
    component:TransactionDetailsComponent,
    props:true
  },
  {
    name:'sign',
    path:'/sign-transaction/:type?',
    component:SignTransactionComponent,
    props:true
  },
  {
    name:'popup-sign-tx',
    path:'/popup-sign-tx',
    component:PopupSignTransactionComponent,
    props:true
  },
  {
    name:'connect',
    path:'/connect',
    component:PopupConnectComponent,
    props:true
  },
  {
    name:'connect-confirm',
    path:'/connect-confirm',
    component:ConnectConfirmComponent,
    props:true
  },
  {
    path:'/manageAccounts',
    component:ManageAccountComponent,
  },
  {
    path:'/settings',
    component:SettingsComponent,
  },
  {
    path:'/generalSettings',
    component:GeneralSettingsComponent,
  },
  {
    path:'/securitySettings',
    component:SecuritySettingsComponent,
  },
  {
    path:'/advancedSettings',
    component:AdvancedSettingsComponent,
  },
  {
    path:'/aboutSettings',
    component:AboutSettingsComponent,
  },
  {
    path:'/utilities',
    component:UtilitiesComponent,
  },
  {
    path:'/tip',
    component:TipComponent
  },
  {
    path:'/allowances',
    component:AllowancesComponent
  },
  {
    path:'/manageNetworks',
    component:ManageNetworksComponent
  },
  {
    path:'/tokens',
    component:FungibleTokensComponent
  },
  {
    path:'/fungible-tokens',
    component:FungibleTokensPageComponent
  },
  {
    path:'/aens',
    component:AensComponent
  },
  {
    name:'auction-bid',
    path: '/auction-bid',
    component: AuctionBid,
    props:true
  },
  {
    path:'/mint-token',
    component: MintFungibleTokenComponent
  },
  {
    name:'sign-verify-message',
    path:'/signAndVerifyMsg',
    component:SignAndVerifyMsg,
    props: true
  },
  {
    path:'/airGapSetup',
    component:AirGapSetup
  },
  {
    path:'/qrCodeReader',
    name:'qrCodeReader',
    props:true,
    component: QrCodeReader
  },
  {
    path:'/signTransactionByQrCode',
    component: SignTransactionByQrCode,
    props: true,
    name: 'signTransactionByQrCode'
  },
  {
    path:'/create-token',
    component:CreateFungibleTokenComponent
  },
  {
    path:'/ledger-setup',
    component:LedgerSetupComponent
  },
  {
    path:'/termsOfService',
    component:TermsOfService
  },
  {
    path:'/privacyPolicy',
    component:PrivacyPolicy
  },
  {
    path: '/token-migration',
    component: TokenMigration
  },
  {
    path: '/token-migration-info',
    component: TokenMigrationInfo
  }
  
];
