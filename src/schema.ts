// Re-export Zero schema from generated source
// This file is kept for backwards compatibility during migration
// After migration is complete, imports should be updated to use src/zero/schema.ts directly

export {
  schema,
  builder,
  permissions,
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
} from "./zero/schema";
