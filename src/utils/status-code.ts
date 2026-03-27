export const ResponseStatusCode = {
  success: 200,
  badRequest: 400,
  unauthorized: 401,
  notFound: 404,
  validationError: 422,
  serverError: 500,
} as const;

export type TResponseStatusCode = (typeof ResponseStatusCode)[keyof typeof ResponseStatusCode];
