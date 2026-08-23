import { getSession } from "@/lib/auth";
import { AppSidebar, MobileNav } from "@/components/app-sidebar";
import { LoginScreen } from "@/components/login-screen";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    return <LoginScreen />;
  }

  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar employee={session} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav employee={session} />
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
