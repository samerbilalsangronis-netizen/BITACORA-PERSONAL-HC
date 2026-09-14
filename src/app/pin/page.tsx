import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PinVerifyForm } from "./PinVerifyForm";

export default async function PinPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("pin_set, nombre")
    .eq("id", user.id)
    .single();

  if (!profile?.pin_set) {
    redirect(`/pin/configurar?next=${encodeURIComponent(next)}`);
  }

  return <PinVerifyForm next={next} nombre={profile.nombre} />;
}
