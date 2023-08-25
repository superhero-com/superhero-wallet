export default ({
  migrations,
  names,
  languages,
  backedUpSeed,
  mnemonic,
  saveErrorLog,
  invites,
  notificationSettings,
  permissions,
  fungibleTokens,
  accounts: { list, activeIdx } = {},
  hiddenCards,
}) => ({
  migrations,
  names,
  languages,
  backedUpSeed,
  mnemonic,
  saveErrorLog,
  invites,
  notificationSettings,
  permissions,
  fungibleTokens,
  accounts: { list, activeIdx },
  hiddenCards,
});
