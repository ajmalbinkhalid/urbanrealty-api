export const ActorTypeEnum = {
  ADMIN: 1,
  AGENCY_MEMBER: 2,
  USER: 3,
} as const;

export type TActorTypeEnum = (typeof ActorTypeEnum)[keyof typeof ActorTypeEnum];
