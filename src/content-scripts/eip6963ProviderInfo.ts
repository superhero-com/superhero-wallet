export interface IEip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

// EIP-6963 wants a square icon; dapps crop anything else to fill their square slot.
const ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="-3 -8 40 40"><path fill="#1161fe" fill-rule="evenodd" d="M0 8.092 9.003 0h15.994L34 8.092 17.048 24 0 8.092zm10.008-5.61h4.885l10.44 10.254L17 20.552 3.735 8.138l6.274-5.655z"/></svg>';

export const SUPERHERO_EIP6963_PROVIDER_INFO: IEip6963ProviderInfo = {
  uuid: '010f6849-a205-46a9-a721-c6ca943d479a',
  name: 'Superhero Wallet',
  icon: `data:image/svg+xml,${encodeURIComponent(ICON_SVG)}`,
  rdns: 'wallet.superhero.com',
};
