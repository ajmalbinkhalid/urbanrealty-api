import logger from "@utils/logger";
import axios from "axios";
import env from "../../env";

type BrevoEmailPayload = {
  sender: { name: string; email: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  textContent: string;
};

class NotificationServiceClass {
  async sendEmail({ to, subject, body }: { to: string; subject: string; body: string }): Promise<void> {
    try {
      const payload: BrevoEmailPayload = {
        sender: {
          name: "UrbanRealty",
          email: env.BREVO_FROM_EMAIL,
        },
        to: [{ email: to }],
        subject,
        textContent: body,
      };

      await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
        headers: {
          "api-key": env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      });

      logger.info(`Email sent to ${to} with subject "${subject}"`);
    } catch (error) {
      logger.error("Failed to send OTP", {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async sendSMS({ to, message }: { to: string; message: string }): Promise<void> {
    await Promise.resolve();
    // Logic to send an SMS
    logger.info(`SMS sent to ${to} with message: ${message}`);
  }

  async sendPushNotification({ to, title, message }: { to: string; title: string; message: string }): Promise<void> {
    await Promise.resolve();
    // Logic to send a push notification
    logger.info(`Push notification sent to ${to} with title "${title}", message: ${message}`);
  }
}

export const NotificationService = new NotificationServiceClass();
