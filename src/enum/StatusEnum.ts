export const VerificationStatusEnum = {
  draft: 0,
  active: 1,
  reject: 2,
  pending: 3,
  packagePending: 4,
} as const;

export const StatusEnum = {
  inactive: 0,
  active: 1,
} as const;

export type TVerificationStatusEnum = (typeof VerificationStatusEnum)[keyof typeof VerificationStatusEnum];
export type TStatusEnum = (typeof StatusEnum)[keyof typeof StatusEnum];
