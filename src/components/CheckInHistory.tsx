import { Card, CardHeader, CardContent, Chip } from "@heroui/react";
import { getModeLabel } from "@/lib/weeks";

interface CheckIn {
  weekKey: string;
  goalMode: string;
  goalDaysPerWeek: number;
  confirmed: boolean;
  confirmedAt: Date | null;
}

interface CheckInHistoryProps {
  checkIns: CheckIn[];
}

export function CheckInHistory({ checkIns }: CheckInHistoryProps) {
  if (checkIns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Check-In History</h3>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500">
            No check-ins yet — your first one arrives Sunday!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Check-In History</h3>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {checkIns.map((ci) => (
            <div
              key={ci.weekKey}
              className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2"
            >
              <div>
                <span className="font-medium">{ci.weekKey}</span>
                <span className="ml-2 text-sm text-zinc-500">
                  {getModeLabel(ci.goalMode)} {ci.goalDaysPerWeek}x/week
                </span>
              </div>
              {ci.confirmed ? (
                <Chip className="bg-green-100 text-green-700" size="sm">Confirmed</Chip>
              ) : (
                <Chip className="bg-amber-100 text-amber-700" size="sm">Pending</Chip>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
