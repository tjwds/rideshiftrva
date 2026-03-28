import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail, EMAIL_FROM, emailFooter } from "@/lib/email";
import { getCurrentWeekKey, getModeLabel } from "@/lib/weeks";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = request.nextUrl.searchParams.get("user");
  if (!email) {
    return NextResponse.json({ error: "Missing ?user= parameter" }, { status: 400 });
  }

  if (session.user.email !== email && !session.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { goal: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.goal) {
    return NextResponse.json({ error: "User has no goal set" }, { status: 400 });
  }

  const weekKey = getCurrentWeekKey();
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const existing = await prisma.weeklyCheckIn.findUnique({
    where: { userId_weekKey: { userId: user.id, weekKey } },
  });

  const confirmToken = crypto.randomBytes(32).toString("hex");

  const checkIn = existing
    ? await prisma.weeklyCheckIn.update({
        where: { id: existing.id },
        data: { confirmToken, goalSnapshot: user.goal.items },
      })
    : await prisma.weeklyCheckIn.create({
        data: {
          userId: user.id,
          weekKey,
          goalSnapshot: user.goal.items,
          confirmToken,
        },
      });

  const yesUrl = `${baseUrl}/checkin/confirm?token=${confirmToken}&response=yes`;
  const noUrl = `${baseUrl}/checkin/confirm?token=${confirmToken}&response=no`;

  const goalBullets = user.goal.items
    .map((g) => `<li>${getModeLabel(g.mode)} ${g.daysPerWeek} day${g.daysPerWeek !== 1 ? "s" : ""}</li>`)
    .join("");

  try {
    await sendMail({
      from: EMAIL_FROM,
      to: user.email!,
      subject: "Did you meet your weekly travel sustainability goals?",
      html: `
        <div style="max-width: 480px; margin: 0 auto; font-family: sans-serif;">
          <h2 style="color: #16a34a;">RideShift RVA</h2>
          <p>Hey${user.name ? ` ${user.name}` : ""}!</p>
          <p>Did you meet your sustainable travel goals this week?</p>
          <p>Your weekly goals were:</p>
          <ul style="margin: 8px 0 16px 0; padding-left: 20px;">${goalBullets}</ul>
          <div style="margin: 20px 0;">
            <a href="${yesUrl}" style="display: inline-block; padding: 14px 28px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 8px;">
              Yes
            </a>
            <a href="${noUrl}" style="display: inline-block; padding: 14px 28px; background: #e4e4e7; color: #3f3f46; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              No
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 16px;">
            Either way, we appreciate your commitment to a greener Richmond.
          </p>
          <p style="color: #666; font-size: 14px;">
            <a href="${baseUrl}/goal" style="color: #16a34a;">Want to change your goals?</a>
          </p>
          ${emailFooter(user.email!)}
        </div>
      `,
    });

    await prisma.weeklyCheckIn.update({
      where: { id: checkIn.id },
      data: { sentAt: new Date() },
    });

    return NextResponse.json({ success: true, email, weekKey });
  } catch (error) {
    console.error(`Failed to send check-in email to ${email}:`, error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
