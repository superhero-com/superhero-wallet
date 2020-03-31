import runMigrations, { registerMigration } from './runner';
import updateState from './update-state';

registerMigration(updateState);

export default runMigrations;
