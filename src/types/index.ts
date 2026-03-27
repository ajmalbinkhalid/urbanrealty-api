import type { TOTPSourceEnum } from "@/enum/OTPSourceEnum";

export type TTokenType = "register" | "login" | "change";

export type TIdentifierData = {
  identifier: string;
  identifierType: "email" | "phone";
  source: TOTPSourceEnum;
};

export type ApiResponse<T = object> = {
  status: number;
  success: boolean;
  message: string;
  data?: T;
};

export interface PaginatedResponse<T = object> extends ApiResponse<T> {
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
