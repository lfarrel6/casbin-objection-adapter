import Knex from "knex";

export function makeAndConfigureDatabase(): Knex {
  const knex = Knex({
    client: "pg",
    useNullAsDefault: true,
    asyncStackTraces: true,
    connection: {
      user: "casbin_objection_adapter_test_user",
      password: "password",
      database: "casbin_objection_adapter_test",
    },
  });

  return knex;
}
