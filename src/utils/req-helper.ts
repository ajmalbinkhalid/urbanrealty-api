import type { Request } from "express";

class ReqHelpersClass {
  locale(req: Request): string {
    const locale = (req.query.locale as string) || "en";
    if (locale !== "en" && locale !== "ar") {
      return "en";
    }

    return locale;
  }

  isArabic(req: Request): boolean {
    return this.locale(req) === "ar";
  }
}

export const ReqHelpers = new ReqHelpersClass();
