// Zero schema wrapper - imports generated schema and adds permissions
// Re-run `bun run generate-zero-schema` after modifying src/db/schema.ts

import {
  definePermissions,
  ExpressionBuilder,
  ANYONE_CAN,
  PermissionsConfig,
} from "@rocicorp/zero";

// Re-export everything from generated schema
export {
  schema,
  builder,
  type Schema,
  type Asset,
  type Counter,
  type CusipQuarterInvestorActivity,
  type Entity,
  type Medium,
  type Message,
  type Period,
  type Search,
  type Superinvestor,
  type User,
  type UserCounter,
  type ValueQuarter,
} from "./schema.gen";

import { schema, type Schema } from "./schema.gen";

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
  ) => cmp("senderId", "=", authData.sub ?? "");

  const allowIfUserCounterOwner = (
    authData: AuthData,
    { cmp }: ExpressionBuilder<Schema, "userCounters">
  ) => cmp("userId", "=", authData.sub ?? "");

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
        update: {
          preMutation: ANYONE_CAN,
          postMutation: ANYONE_CAN,
        },
      },
    },
    valueQuarters: {
      row: {
        select: ANYONE_CAN,
      },
    },
    entities: {
      row: {
        select: ANYONE_CAN,
      },
    },
    userCounters: {
      row: {
        select: [allowIfUserCounterOwner],
        insert: [allowIfUserCounterOwner],
        update: {
          preMutation: [allowIfUserCounterOwner],
          postMutation: [allowIfUserCounterOwner],
        },
      },
    },
    searches: {
      row: {
        select: ANYONE_CAN,
      },
    },
    assets: {
      row: {
        select: ANYONE_CAN,
      },
    },
    superinvestors: {
      row: {
        select: ANYONE_CAN,
      },
    },
    cusipQuarterInvestorActivity: {
      row: {
        select: ANYONE_CAN,
      },
    },
    // Note: cusipQuarterInvestorActivityDetail removed - served via pg_duckdb from Parquet files
    periods: {
      row: {
        select: ANYONE_CAN,
      },
    },
  } satisfies PermissionsConfig<AuthData, Schema>;
});
