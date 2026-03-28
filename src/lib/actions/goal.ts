"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function upsertGoal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const mode = formData.get("mode") as string;
  const daysPerWeek = parseInt(formData.get("daysPerWeek") as string, 10);

  if (!mode || !daysPerWeek || daysPerWeek < 1 || daysPerWeek > 7) {
    throw new Error("Invalid goal");
  }

  await prisma.goal.upsert({
    where: { userId: session.user.id },
    update: { mode, daysPerWeek },
    create: { userId: session.user.id, mode, daysPerWeek },
  });

  revalidatePath("/");
  redirect("/");
}

export async function clearGoal() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await prisma.goal.deleteMany({ where: { userId: session.user.id } });

  revalidatePath("/");
  redirect("/");
}
