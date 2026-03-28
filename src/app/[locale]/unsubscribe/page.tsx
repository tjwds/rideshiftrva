import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { unsubscribeToken } from "@/lib/email";
import { Card, CardHeader, CardContent, Button } from "@heroui/react";
import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Unsubscribe",
};

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; token?: string }>;
}

export default async function UnsubscribePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("unsubscribe");
  const { email, token } = await searchParams;

  if (!email || !token || token !== unsubscribeToken(email)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent>
            <p className="text-zinc-500">{t("invalid")}</p>
            <Link href="/" className="mt-4 inline-block text-green-600 underline">
              {t("backHome")}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  await prisma.user.updateMany({
    where: { email },
    data: { emailOptOut: true },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="flex flex-col pb-0">
          <h1 className="text-xl font-bold text-green-600">{t("title")}</h1>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-zinc-600">{t("success")}</p>
          <p className="text-sm text-zinc-500">{t("successDetail")}</p>
          <Link href="/">
            <Button className="bg-green-600 text-white font-semibold">
              {t("backHome")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
