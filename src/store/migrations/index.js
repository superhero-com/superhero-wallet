import runMigrations, { registerMigration } from './runner';
import collectState from './00-collect-state';
import setDefaultNames from './01-set-default-names';
import resetPermissions from './02-reset-permissions';
import addFungibleTokensNewFields from './03-add-fungible-tokens-new-fields';
import addNamesNewFields from './04-add-names-new-fields';
import changeTransactionsStructure from './05-change-transactions-structure';
import changeTransactionsStructure2 from './06-change-transactions-structure-2';
import changeInviteLinksFormat from './07-change-invite-links-format';

registerMigration(collectState);
registerMigration(setDefaultNames);
registerMigration(resetPermissions);
registerMigration(addFungibleTokensNewFields);
registerMigration(addNamesNewFields);
registerMigration(changeTransactionsStructure);
registerMigration(changeTransactionsStructure2);
registerMigration(changeInviteLinksFormat);

export default runMigrations;
