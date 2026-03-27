export const OTPSourceEnum = {
  agencyApp: 1,
  agencyWeb: 2,
  userApp: 3,
  userWeb: 4,
  adminDashboard: 5,
} as const;

export type TOTPSourceEnum = (typeof OTPSourceEnum)[keyof typeof OTPSourceEnum];
