import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Providers } from "../providers";
import { SiteHeader } from "@/components/SiteHeader";
import { getTranslations } from "next-intl/server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "footer" });

  return (
    <NextIntlClientProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow">
        Skip to main content
      </a>
      <Providers>
        <SiteHeader />
        <div id="main-content" className="flex-1">
          {children}
        </div>
        <footer className="px-4 py-8 text-center border-t border-zinc-100">
          <div className="mx-auto max-w-xl">
            <p className="font-semibold text-zinc-700">
              {t("builtAt")}{" "}
              <a
                href="https://rvahacks.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 underline underline-offset-2 hover:text-green-700"
              >
                {t("hackForRVA")}
              </a>
            </p>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              {t("tagline")}
            </p>
            <a
              href="https://github.com/tjwds/rideshiftrva"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-zinc-400 underline underline-offset-2 hover:text-zinc-600"
              aria-label="RideShift RVA on GitHub"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              view code on GitHub
            </a>
            <br />
            <a
              href="mailto:rideshiftrva@joewoods.dev"
              className="mt-1 inline-flex items-center gap-1.5 text-sm text-zinc-400 underline underline-offset-2 hover:text-zinc-600"
            >
              contact us
            </a>
          </div>
        </footer>
      </Providers>
    </NextIntlClientProvider>
  );
}
