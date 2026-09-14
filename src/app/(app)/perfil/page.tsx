import { requireUser } from "@/lib/session";
import { Card, CardTitle } from "@/components/ui/Card";
import { ChangePasswordForm } from "@/components/perfil/ChangePasswordForm";
import { ChangePinForm } from "@/components/perfil/ChangePinForm";
import { ReminderForm } from "@/components/perfil/ReminderForm";
import { SignOutButton } from "@/components/layout/SignOutButton";

export default async function PerfilPage() {
  const { user, profile } = await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Perfil</h1>
        <p className="text-sm text-muted">Gestiona tu cuenta y preferencias.</p>
      </div>

      <Card>
        <CardTitle className="mb-4">Cuenta</CardTitle>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Nombre</dt>
            <dd className="font-medium">{profile?.nombre || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Correo</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
        </dl>
      </Card>

      <ChangePasswordForm />
      <ChangePinForm hasPinSet={profile?.pin_set ?? false} />
      <ReminderForm reminderEnabled={profile?.reminder_enabled ?? true} reminderTime={profile?.reminder_time ?? "08:00"} />

      <Card>
        <SignOutButton />
      </Card>
    </div>
  );
}
