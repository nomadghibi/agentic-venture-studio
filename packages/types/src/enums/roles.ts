export const UserRoleValues = [
  "founder",
  "product_lead",
  "research_reviewer",
  "technical_architect",
  "growth_lead",
  "finance_reviewer",
  "builder",
  "admin",
  "viewer"
] as const;

export type UserRole = (typeof UserRoleValues)[number];
