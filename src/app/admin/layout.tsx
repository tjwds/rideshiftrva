import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/");

  return (
    <div className="mx-auto max-w-3xl p-4 py-8">
      <div className="mb-8 flex items-center justify-between border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-green-600">Admin</h1>
          <AdminNav />
        </div>
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700">
          &larr; Back to App
        </Link>
      </div>
      {children}
    </div>
  );
}
