import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  db_url: process.env.DATABASE_URL,
  port: process.env.PORT || 8000,
  frontend_url: process.env.FRONTEND_URL || "http://localhost:3000",
  backend_url: process.env.BACKEND_URL || "http://localhost:8000",
  better_auth_secret: process.env.BETTER_AUTH_SECRET,
  admin_name: process.env.ADMIN_NAME as string,
  admin_email: process.env.ADMIN_EMAIL as string,
  admin_password: process.env.ADMIN_PASSWORD as string,
  admin_role: process.env.ADMIN_ROLE,
  admin_phone: process.env.ADMIN_PHONE as string,
  admin_image: process.env.ADMIN_IMAGE,
  app_name: process.env.APP_NAME,
  app_email: process.env.APP_EMAIL as string,
  app_pass: process.env.APP_PASS,
};
 
export default config;
