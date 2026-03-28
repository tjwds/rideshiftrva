import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { calculateImpact, calculateModeBreakdown } from "@/lib/impact";
import { Card, CardContent, Button } from "@heroui/react";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Community Impact",
};

const MODE_ORDER = ["bike", "bus", "carpool", "walk", "scooter"] as const;

export default async function ImpactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("impact");
  const tModes = await getTranslations("modes");

  const [totalUsers, allCheckIns] = await Promise.all([
    prisma.user.count(),
    prisma.weeklyCheckIn.findMany({
      where: { response: "yes" },
      select: { response: true, goalSnapshot: true },
    }),
  ]);

  const impact = calculateImpact(allCheckIns);
  const modeBreakdown = calculateModeBreakdown(allCheckIns);
  const totalTrips = Object.values(modeBreakdown).reduce((sum, n) => sum + n, 0);

  const hasData = allCheckIns.length > 0;

  // Find the mode with the most trips for the demand signal
  const topMode = MODE_ORDER.reduce<{ mode: string; count: number }>(
    (best, mode) => (modeBreakdown[mode] || 0) > best.count
      ? { mode, count: modeBreakdown[mode] || 0 }
      : best,
    { mode: "", count: 0 },
  );

  return (
    <div className="mx-auto max-w-3xl p-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-lg text-zinc-600">{t("subtitle")}</p>
        <p className="mt-2 text-sm text-zinc-500">{t("description")}</p>
      </div>

      {!hasData ? (
        <Card className="text-center">
          <CardContent>
            <p className="text-zinc-500">{t("noDataYet")}</p>
            <Link href="/auth/signin" className="mt-4 inline-block">
              <Button className="bg-green-600 text-white font-semibold">
                {t("getStarted")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Aggregate stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="text-center">
                <p className="text-3xl font-bold text-green-600">{totalUsers}</p>
                <p className="text-sm text-zinc-500">{t("totalParticipants")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-3xl font-bold text-green-600">{impact.tripsAvoided}</p>
                <p className="text-sm text-zinc-500">{t("totalTrips")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-3xl font-bold text-green-600">{impact.milesSaved}</p>
                <p className="text-sm text-zinc-500">{t("totalMiles")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-3xl font-bold text-green-600">{impact.co2SavedLbs}</p>
                <p className="text-sm text-zinc-500">{t("totalCo2")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Mode breakdown */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold">{t("modeBreakdownTitle")}</h2>
            <p className="mb-4 text-sm text-zinc-500">{t("modeBreakdownSubtitle")}</p>
            <div className="flex flex-col gap-3">
              {MODE_ORDER.filter((mode) => modeBreakdown[mode]).map((mode) => {
                const count = modeBreakdown[mode];
                const pct = totalTrips > 0 ? Math.round((count / totalTrips) * 100) : 0;
                return (
                  <div key={mode}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{tModes(mode)}</span>
                      <span className="text-zinc-500">{t("trips", { count })}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full bg-green-500"
                        style={{ width: `${pct}%` }}
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${tModes(mode)}: ${pct}%`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Demand signal callout */}
          {topMode.count > 0 && (
            <Card className="mb-8 border border-green-200 bg-green-50">
              <CardContent className="text-center">
                <p className="text-lg font-semibold text-green-800">
                  {t("demandSignal", {
                    count: topMode.count,
                    mode: tModes(topMode.mode as "bike" | "bus" | "carpool" | "walk" | "scooter").toLowerCase(),
                  })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Planner note */}
          <p className="mb-8 text-center text-sm text-zinc-500">
            {t("plannerNote")}
          </p>

          {/* CTA */}
          <div className="text-center">
            <p className="mb-3 text-lg font-semibold">{t("callToAction")}</p>
            <Link href="/auth/signin">
              <Button className="bg-green-600 text-white font-semibold text-lg px-8 py-3">
                {t("getStarted")}
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
