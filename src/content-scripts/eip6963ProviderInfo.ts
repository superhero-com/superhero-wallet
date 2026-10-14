export interface IEip6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export const SUPERHERO_EIP6963_PROVIDER_INFO: IEip6963ProviderInfo = {
  uuid: '010f6849-a205-46a9-a721-c6ca943d479a',
  name: 'Superhero Wallet',
  icon: 'data:image/svg+xml,%3Csvg%20data-v-d6e638c8%3D%22%22%20viewBox%3D%220%200%2034%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20class%3D%22icon%20home-icon%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M0%208.09196L9.00282%200H24.9972L34%208.09196L17.0479%2024L0%208.09196ZM10.0085%202.48276H14.893L25.3324%2012.7356L17%2020.5517L3.73521%208.13794L10.0085%202.48276Z%22%20fill%3D%22%231161fe%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E',
  rdns: 'wallet.superhero.com',
};
