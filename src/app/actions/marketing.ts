"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ageGroupId } from "@/lib/age-group";
import { daysUntilBirthday } from "@/lib/dates";

export async function sendNewsletter(formData: FormData) {
  await requireSession();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const audience = String(formData.get("audience") ?? "all");
  if (!subject || !body) throw new Error("Subject and body are required.");

  const customers = await prisma.customer.findMany();
  const recipients = customers.filter((c) => {
    if (audience === "all") return true;
    if (audience.startsWith("occasion:")) {
      return c.favoriteOccasion === audience.slice("occasion:".length);
    }
    if (audience.startsWith("age:")) {
      return ageGroupId(c.age) === audience.slice("age:".length);
    }
    return true;
  });

  await prisma.campaign.create({
    data: {
      type: "newsletter",
      subject,
      body,
      audience,
      recipientCount: recipients.length,
    },
  });

  revalidatePath("/marketing");
}

export async function sendBirthdayReminders() {
  await requireSession();
  const customers = await prisma.customer.findMany();
  const upcoming = customers.filter((c) => {
    const days = daysUntilBirthday(c.birthday);
    return days >= 0 && days <= 14;
  });

  await prisma.campaign.create({
    data: {
      type: "birthday_reminder",
      subject: "Your Barly birthday window is open",
      body: "Book a package in the next two weeks and we’ll add a complimentary garnish kit.",
      audience: "birthdays-14d",
      recipientCount: upcoming.length,
    },
  });

  revalidatePath("/marketing");
  revalidatePath("/");
}
