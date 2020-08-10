const migrations = [];

export const registerMigration = migration => migrations.push(migration);

export default async state => {
  if (!state) {
    return {
      migrations: migrations.reduce((p, m, id) => ({ ...p, [id]: true }), {}),
    };
  }

  return migrations
    .filter((migration, idx) => !state.migrations[idx])
    .reduce(async (acc, migration, idx) => {
      const migratedState = await migration(await acc);
      migratedState.migrations[idx] = true;
      return migratedState;
    }, Promise.resolve(state));
};
