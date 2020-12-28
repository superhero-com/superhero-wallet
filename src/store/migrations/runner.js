const migrations = [];

export const registerMigration = (migration) => migrations.push(migration);

export default async (state) => {
  if (!state) {
    return {
      migrations: migrations.reduce((p, m, id) => ({ ...p, [id]: true }), {}),
    };
  }

  return migrations.reduce(async (acc, migration, idx) => {
    let migratedState = await acc;
    if (!migratedState.migrations[idx]) {
      migratedState = await migration(migratedState);
      migratedState.migrations[idx] = true;
    }
    return migratedState;
  }, Promise.resolve(state));
};
