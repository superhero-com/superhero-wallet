import runMigrations, { registerMigration } from './runner';
import updateState from './update-state';
import updateDefaultName from './update-default-name';

registerMigration(updateState);
registerMigration(updateDefaultName);

export default runMigrations;
