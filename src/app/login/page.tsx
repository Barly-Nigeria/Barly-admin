import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginScreen } from "@/components/login-screen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/");
  const { error } = await searchParams;
  return <LoginScreen error={error === "1"} />;
}
