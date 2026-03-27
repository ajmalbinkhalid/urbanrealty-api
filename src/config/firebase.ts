import env from "env";
import admin from "firebase-admin";
import logger from "@/utils/logger";

const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});

logger.info(" Firebase initialized ");

export const firebaseAdmin = admin;
