import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentWeekKey, getWeekDateRange, getModeLabel } from "@/lib/weeks";
import { RewardGrid } from "@/components/RewardGrid";
import { CheckInHistory } from "@/components/CheckInHistory";
import { GoalForm } from "@/components/GoalForm";
import { Card, CardContent, Chip, Button } from "@heroui/react";
import Link from "next/link";

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4 text-center">
      <div className="max-w-2xl">
        <h1 className="text-5xl font-bold text-green-600">Ride Shift RVA</h1>
        <p className="mt-2 text-xl text-zinc-600">Move green, save green.</p>
        <p className="mt-4 text-lg text-zinc-500">
          Set a weekly car-free commute goal, confirm you met it, and unlock
          rewards from local Richmond businesses.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/auth/signin">
            <Button className="bg-green-600 text-white font-semibold text-lg px-8 py-3">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
      <div className="mt-8 grid max-w-3xl gap-6 sm:grid-cols-3">
        <Card>
          <CardContent className="text-center">
            <p className="text-3xl">&#127919;</p>
            <h3 className="mt-2 font-semibold">Set Your Goal</h3>
            <p className="text-sm text-zinc-500">
              Choose how you&apos;ll commute — bike, bus, carpool, or walk
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-3xl">&#128231;</p>
            <h3 className="mt-2 font-semibold">Weekly Check-In</h3>
            <p className="text-sm text-zinc-500">
              Get an email Sunday asking &quot;Did you do it?&quot;
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-3xl">&#127873;</p>
            <h3 className="mt-2 font-semibold">Earn Rewards</h3>
            <p className="text-sm text-zinc-500">
              Unlock coupons from local Richmond businesses
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) return <LandingPage />;

  const [goal, currentCheckIn, recentCheckIns] = await Promise.all([
    prisma.goal.findUnique({ where: { userId: session.user.id } }),
    prisma.weeklyCheckIn.findUnique({
      where: {
        userId_weekKey: { userId: session.user.id, weekKey: getCurrentWeekKey() },
      },
    }),
    prisma.weeklyCheckIn.findMany({
      where: { userId: session.user.id },
      orderBy: { weekKey: "desc" },
      take: 10,
    }),
  ]);

  if (!goal) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <GoalForm />
      </div>
    );
  }

  const weekKey = getCurrentWeekKey();
  const { monday, sunday } = getWeekDateRange(weekKey);

  const rewards = await prisma.reward.findMany({
    where: {
      active: true,
      validFrom: { lte: sunday },
      validTo: { gte: monday },
    },
    include: { _count: { select: { redemptions: true } } },
  });

  const userRedemptions = await prisma.redemption.findMany({
    where: { userId: session.user.id, weekKey },
  });
  const redeemedRewardIds = new Set(userRedemptions.map((r) => r.rewardId));

  const confirmed = currentCheckIn?.confirmed ?? false;

  return (
    <div className="mx-auto max-w-3xl p-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-600">Ride Shift RVA</h1>
          <p className="text-sm text-zinc-500">{session.user.email}</p>
        </div>
        <Link href="/goal">
          <Button className="bg-zinc-100 text-zinc-700" size="sm">Edit Goal</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Your weekly goal</p>
              <p className="text-lg font-semibold">
                {getModeLabel(goal.mode)} {goal.daysPerWeek}x per week
              </p>
            </div>
            {confirmed ? (
              <Chip className="bg-green-100 text-green-700">This week: Confirmed!</Chip>
            ) : (
              <Chip className="bg-amber-100 text-amber-700">
                Complete your check-in on Sunday to unlock
              </Chip>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="mb-3 text-xl font-semibold">
          This Week&apos;s Rewards
          {rewards.length > 0 && (
            <span className="ml-2 text-sm font-normal text-zinc-500">
              {rewards.length} from local businesses
            </span>
          )}
        </h2>
        <RewardGrid
          rewards={rewards.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            businessName: r.businessName,
            businessLogo: r.businessLogo,
            couponCode: r.couponCode,
            maxRedemptions: r.maxRedemptions,
            totalRedemptions: r._count.redemptions,
          }))}
          confirmed={confirmed}
          redeemedRewardIds={redeemedRewardIds}
        />
      </div>

      <CheckInHistory
        checkIns={recentCheckIns.map((ci) => ({
          weekKey: ci.weekKey,
          goalMode: ci.goalMode,
          goalDaysPerWeek: ci.goalDaysPerWeek,
          confirmed: ci.confirmed,
          confirmedAt: ci.confirmedAt,
        }))}
      />
    </div>
  );
}
