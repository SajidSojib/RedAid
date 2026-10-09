import { BloodType, Role, UserStatus } from "../../generated/prisma/enums";
import config from "../config";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

async function seedAdmin() {
  try {
    const email = config.admin_email.trim().toLowerCase();

    const existingAdmin = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      return;
    }

    const result = await auth.api.signUpEmail({
      body: {
        name: config.admin_name,
        email,
        password: config.admin_password,
        phone: config.admin_phone,
        bloodType: BloodType.O_POSITIVE,
        lastDonationDate: new Date("2000-01-01"),
        image: config.admin_image || undefined,
      },
      headers: new Headers({
        origin: config.frontend_url,
      }),
    });

    if (!result?.user?.id) {
      throw new Error("Better Auth did not return a created user.");
    }

    // Assign admin privileges and verify the email.
    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    console.log("Admin seeding completed successfully.");
  } catch (error) {
    console.error("Admin seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
