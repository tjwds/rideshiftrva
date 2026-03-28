/**
 * Send a weekly check-in email to a specific email address.
 * Looks up the user's actual goal from the database.
 *
 * Usage:
 *   npx tsx scripts/send-checkin.ts <email>            # send for real
 *   npx tsx scripts/send-checkin.ts <email> --dry-run  # print email content
 */

import "dotenv/config";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const email = process.argv[2];
const dryRun = process.argv.includes("--dry-run");

if (!email) {
  console.error("Usage: npx tsx scripts/send-checkin.ts <email> [--dry-run]");
  process.exit(1);
}

const prisma = new PrismaClient();
const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
const emailFrom = process.env.EMAIL_FROM || "noreply@rideshiftrva.com";

const MODE_LABELS: Record<string, string> = {
  carpool: "Carpool",
  bike: "Bike",
  bus: "Bus",
  walk: "Walk",
  scooter: "Scooter",
};

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { goal: true },
  });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  if (!user.goal) {
    console.error(`User ${email} has no goal set.`);
    process.exit(1);
  }

  const modeLabel = MODE_LABELS[user.goal.mode] || user.goal.mode;
  const confirmToken = crypto.randomBytes(32).toString("hex");
  const confirmUrl = `${baseUrl}/checkin/confirm?token=${confirmToken}`;

  const subject = `Did you ${modeLabel.toLowerCase()} ${user.goal.daysPerWeek} days this week?`;
  const html = `
  <div style="max-width: 480px; margin: 0 auto; font-family: sans-serif;">
    <h2 style="color: #16a34a;">Ride Shift RVA</h2>
    <p>Hey${user.name ? ` ${user.name}` : ""}!</p>
    <p>
      Your goal this week: <strong>${modeLabel} ${user.goal.daysPerWeek} days</strong>
    </p>
    <p>Did you do it?</p>
    <a href="${confirmUrl}" style="display: inline-block; padding: 14px 28px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Yes, I did it!
    </a>
    <p style="color: #666; font-size: 14px; margin-top: 16px;">
      Confirming unlocks this week's rewards from local Richmond businesses.
    </p>
  </div>
`;

  if (dryRun) {
    console.log("=== DRY RUN — email would be sent as follows ===\n");
    console.log(`From:    ${emailFrom}`);
    console.log(`To:      ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Name:    ${user.name || "(none)"}`);
    console.log(`Goal:    ${modeLabel} ${user.goal.daysPerWeek}x/week`);
    console.log(`Token:   ${confirmToken}`);
    console.log(`Link:    ${confirmUrl}`);
    console.log(`\n--- HTML body ---\n`);
    console.log(html);
    process.exit(0);
  }

  if (!process.env.EMAIL_SERVER) {
    console.error("EMAIL_SERVER is not set. Use --dry-run to preview without sending.");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport(process.env.EMAIL_SERVER);

  console.log(`Sending check-in email to ${email} (${modeLabel} ${user.goal.daysPerWeek}x/week)...`);

  await transporter.sendMail({
    from: emailFrom,
    to: email,
    subject,
    html,
  });

  console.log("Sent!");
  console.log(`\nConfirm link: ${confirmUrl}`);
  console.log(`(Note: this token is not in the database — the confirm page will show "Already confirmed")`);
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
