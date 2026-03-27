class StringHelpersClass {
  capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  normalizeCRN(crn: string): string {
    return crn.trim().toUpperCase();
  }

  normalizePhone({ phoneCode, phoneNumber }: { phoneCode: string; phoneNumber: string }): string {
    return `${phoneCode} ${phoneNumber}`.trim();
  }

  splitPhone(normalizedPhone: string): { phoneCode: string; phoneNumber: string } {
    const [phoneCode, ...phoneNumberParts] = normalizedPhone.split(" ");
    const phoneNumber = phoneNumberParts.join(" ");
    return { phoneCode, phoneNumber };
  }
}

export const StringHelpers = new StringHelpersClass();
