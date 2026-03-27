import { NotificationTokenModel } from "@/database/models/NotificationTokenModel";
import type { TActorTypeEnum } from "@/enum/actor-type-enum";
import { firebaseAdmin } from "../config/firebase";

type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

export async function sendNotificationToUsers(userIds: string[], userType: TActorTypeEnum, payload: NotificationPayload): Promise<void> {
  const tokensDoc = await NotificationTokenModel.find({
    userId: { $in: userIds },
    userType,
  });

  const tokens = tokensDoc.map((t) => t.token);

  if (!tokens.length) {
    return;
  }

  const response = await firebaseAdmin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data,
  });

  await Promise.all(
    response.responses.map((res, index) => {
      if (!res.success) {
        return NotificationTokenModel.deleteOne({
          token: tokens[index],
        });
      }
      return Promise.resolve();
    })
  );
}
