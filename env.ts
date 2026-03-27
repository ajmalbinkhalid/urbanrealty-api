import dotenv from "dotenv";
import { cleanEnv, num, port, str, url } from "envalid";

dotenv.config();

const env = cleanEnv(process.env, {
  ENV: str({ choices: ["local", "production"], default: "local" }),
  PORT: port({ default: 4500 }),
  MONGO_CONNECTION_STRING: str(),

  FIREBASE_PROJECT_ID: str(),
  FIREBASE_CLIENT_EMAIL: str(),
  FIREBASE_PRIVATE_KEY: str(),
  ADMIN_EMAIL: str({ default: "admin@aip.com" }),
  ADMIN_PASSWORD: str({ default: "admin" }),
  JWT_SECRET_KEY: str({
    default: "eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWioUi4iLCJlbWFpbCI6ImFkbWluQGVtYy5jb20ifQ.xCyQt3wQXRj8NojG-m26LS9GktX90VBxU15BoxLuTS8",
  }),
  JWT_EXPIRY_DAYS: num({ default: 7 }),
  OTP_SECRET_KEY: str({
    default: "eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWioUi4iLCJlbWFpbCI6ImFkbWluQGVtYy5jb20ifQ.xCyQt3wQXRj8NojG-m26LS9GktX90VBxU15BoxLuTS812121212",
  }),
  OTP_EXPIRY_MINUTES: num({ default: 5 }),
  DEFAULT_PHONE_CODE: str({ default: "91" }),
  STORAGE_URL: url({ default: "http://localhost:4500/" }),
  BREVO_API_KEY: str(),
  BREVO_FROM_EMAIL: str(),
});

export default env;
