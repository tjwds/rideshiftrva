"use client";

import { Card, CardContent, CardFooter, Chip, Button } from "@heroui/react";
import { claimReward } from "@/lib/actions/rewards";
import { useState } from "react";

interface RewardCardProps {
  reward: {
    id: string;
    title: string;
    description: string;
    businessName: string;
    businessLogo: string | null;
    couponCode: string | null;
    maxRedemptions: number | null;
    totalRedemptions: number;
  };
  confirmed: boolean;
  redeemed: boolean;
  allClaimed: boolean;
}

export function RewardCard({ reward, confirmed, redeemed, allClaimed }: RewardCardProps) {
  const [claiming, setClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);

  const isClaimed = redeemed || justClaimed;

  async function handleClaim() {
    setClaiming(true);
    try {
      await claimReward(reward.id);
      setJustClaimed(true);
    } catch {
      // ignore
    } finally {
      setClaiming(false);
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="flex flex-row gap-4">
        {reward.businessLogo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reward.businessLogo}
            alt={reward.businessName}
            className="h-16 w-16 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-500">{reward.businessName}</p>
          <h3 className="text-lg font-semibold">{reward.title}</h3>
          {confirmed && (
            <p className="mt-1 text-sm text-zinc-600">{reward.description}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        {!confirmed && (
          <p className="text-sm text-zinc-400">Complete your check-in to unlock</p>
        )}
        {confirmed && allClaimed && !isClaimed && (
          <Chip className="bg-zinc-100 text-zinc-600">All claimed</Chip>
        )}
        {confirmed && isClaimed && (
          <div className="flex items-center gap-2">
            <Chip className="bg-green-100 text-green-700">Claimed</Chip>
            {reward.couponCode && (
              <code className="rounded bg-zinc-100 px-2 py-1 text-sm font-mono">
                {reward.couponCode}
              </code>
            )}
          </div>
        )}
        {confirmed && !isClaimed && !allClaimed && (
          <Button
            className="bg-green-100 text-green-700"
            size="sm"
            isDisabled={claiming}
            onPress={handleClaim}
          >
            {claiming ? "Claiming..." : "Claim Reward"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
