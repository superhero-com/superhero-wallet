const migrations = [];

export const registerMigration = migration => migrations.push(migration);

export default (state, store) => {
  let newState = state ? {
    migrations: {},
    ...state,
  } : {
    migrations: migrations.reduce((p, m, id) => ({ ...p, [id]: false }), {}),
  };

  const asyncMigrations = [];

  migrations.forEach(async (migration, idx) => {
    if (newState.migrations[idx]) return;
    const result = migration.migrate(newState, store);
    if (typeof result.then !== 'function') {
      newState = result;
      newState.migrations[idx] = true;
    } else asyncMigrations.push({ promise: result, idx });
  });


  asyncMigrations.forEach(async ({ promise, idx }) => {
    await promise;
    store.commit('markMigrationAsApplied', idx);
  });

  return newState;
};