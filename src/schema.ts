// These data structures define your client-side schema.
// They must be equal to or a subset of the server-side schema.
// Note the "relationships" field, which defines first-class
// relationships between tables.
// See https://github.com/rocicorp/mono/blob/main/apps/zbugs/shared/schema.ts
// for more complex examples, including many-to-many.

import {
  createSchema,
  definePermissions,
  ExpressionBuilder,
  Row,
  ANYONE_CAN,
  table,
  string,
  boolean,
  number,
  relationships,
  PermissionsConfig,
  json,
} from "@rocicorp/zero";

const message = table("message")
  .columns({
    id: string(),
    senderID: string().from("sender_id"),
    mediumID: string().from("medium_id"),
    body: string(),
    labels: json<string[]>(),
    timestamp: number(),
  })
  .primaryKey("id");

const user = table("user")
  .columns({
    id: string(),
    name: string(),
    partner: boolean(),
  })
  .primaryKey("id");

const medium = table("medium")
  .columns({
    id: string(),
    name: string(),
  })
  .primaryKey("id");

const counter = table("counters")
  .columns({
    id: string(),
    value: number(),
  })
  .primaryKey("id");

const valueQuarter = table("value_quarters")
  .columns({
    quarter: string(),
    value: number(),
  })
  .primaryKey("quarter");

const entity = table("entities")
  .columns({
    id: string(),
    name: string(),
    category: string(),
    description: string(),
    value: number(),
    created_at: string().from("created_at"),
  })
  .primaryKey("id");

const messageRelationships = relationships(message, ({ one }) => ({
  sender: one({
    sourceField: ["senderID"],
    destField: ["id"],
    destSchema: user,
  }),
  medium: one({
    sourceField: ["mediumID"],
    destField: ["id"],
    destSchema: medium,
  }),
}));

export const schema = createSchema({
  tables: [user, medium, message, counter, valueQuarter, entity],
  relationships: [messageRelationships],
});

export type Schema = typeof schema;
export type Message = Row<typeof schema.tables.message>;
export type Medium = Row<typeof schema.tables.medium>;
export type User = Row<typeof schema.tables.user>;
export type Counter = Row<typeof schema.tables.counters>;
export type ValueQuarter = Row<typeof schema.tables.value_quarters>;
export type Entity = Row<typeof schema.tables.entities>;

// The contents of your decoded JWT.
type AuthData = {
  sub: string | null;
};

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  const allowIfLoggedIn = (
    authData: AuthData,
    { cmpLit }: ExpressionBuilder<Schema, keyof Schema["tables"]>
  ) => cmpLit(authData.sub, "IS NOT", null);

  const allowIfMessageSender = (
    authData: AuthData,
    { cmp }: ExpressionBuilder<Schema, "message">
  ) => cmp("senderID", "=", authData.sub ?? "");

  return {
    medium: {
      row: {
        select: ANYONE_CAN,
      },
    },
    user: {
      row: {
        select: ANYONE_CAN,
      },
    },
    message: {
      row: {
        insert: ANYONE_CAN,
        update: {
          preMutation: [allowIfMessageSender],
          postMutation: [allowIfMessageSender],
        },
        delete: [allowIfLoggedIn],
        select: ANYONE_CAN,
      },
    },
    counters: {
      row: {
        select: ANYONE_CAN,
      },
    },
    value_quarters: {
      row: {
        select: ANYONE_CAN,
      },
    },
    entities: {
      row: {
        select: ANYONE_CAN,
      },
    },
  } satisfies PermissionsConfig<AuthData, Schema>;
});
