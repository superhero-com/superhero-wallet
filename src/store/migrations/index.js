import runMigrations, { registerMigration } from './runner';
import collectState from './00-collect-state';
import setDefaultNames from './01-set-default-names';

registerMigration(collectState);
registerMigration(setDefaultNames);

export default runMigrations;
