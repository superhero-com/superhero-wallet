import runMigrations, { registerMigration } from './runner';
import collectState from './00-collect-state';
import setDefaultNames from './01-set-default-names';
import resetPermissions from './02-reset-permissions';

registerMigration(collectState);
registerMigration(setDefaultNames);
registerMigration(resetPermissions);

export default runMigrations;
