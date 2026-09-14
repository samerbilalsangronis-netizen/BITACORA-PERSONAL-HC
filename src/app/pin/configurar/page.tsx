import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PinSetupForm } from "./PinSetupForm";

export default async function PinSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/dashboard" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <PinSetupForm next={next} />;
}
