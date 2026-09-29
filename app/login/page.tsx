"use client";

import { useEffect, useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn, signUp } from "@/lib/actions/auth";

type Errors = Record<string, string>;

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {hint && <span className="ml-1 font-normal text-muted-foreground">({hint})</span>}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordInput(props: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="h-11 pr-11 text-base" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" className="h-11 w-full text-base" disabled={pending}>
      {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
      {children}
    </Button>
  );
}

function LoginForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Errors>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrors({});
    startTransition(async () => {
      // En cas de succès, la Server Action redirige : seule une erreur revient ici.
      const res = await signIn(formData);
      if (res && !res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="login-email" label="Adresse e-mail" error={errors.email}>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          aria-invalid={!!errors.email}
          className="h-11 text-base"
        />
      </Field>
      <Field id="login-password" label="Mot de passe" error={errors.password}>
        <PasswordInput
          id="login-password"
          name="password"
          autoComplete="current-password"
          required
          aria-invalid={!!errors.password}
        />
      </Field>
      <SubmitButton pending={pending}>Se connecter</SubmitButton>
    </form>
  );
}

function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Errors>({});
  const [sentTo, setSentTo] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    setErrors({});
    startTransition(async () => {
      const res = await signUp(formData);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      toast.success(res.message);
      setSentTo(email);
    });
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <MailCheck className="size-10 text-primary" />
        <h2 className="text-lg font-semibold">Vérifiez votre boîte mail</h2>
        <p className="text-sm text-muted-foreground">
          Un lien de confirmation a été envoyé à <strong>{sentTo}</strong>. Cliquez dessus pour
          activer votre compte.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-first" label="Prénom" error={errors.firstName}>
          <Input id="reg-first" name="firstName" autoComplete="given-name" required
            aria-invalid={!!errors.firstName} className="h-11 text-base" />
        </Field>
        <Field id="reg-last" label="Nom" error={errors.lastName}>
          <Input id="reg-last" name="lastName" autoComplete="family-name" required
            aria-invalid={!!errors.lastName} className="h-11 text-base" />
        </Field>
      </div>
      <Field id="reg-phone" label="Téléphone" hint="facultatif" error={errors.phone}>
        <Input id="reg-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel"
          aria-invalid={!!errors.phone} className="h-11 text-base" />
      </Field>
      <Field id="reg-email" label="Adresse e-mail" error={errors.email}>
        <Input id="reg-email" name="email" type="email" inputMode="email" autoComplete="email"
          required aria-invalid={!!errors.email} className="h-11 text-base" />
      </Field>
      <Field id="reg-password" label="Mot de passe" hint="8 caractères minimum" error={errors.password}>
        <PasswordInput id="reg-password" name="password" autoComplete="new-password" required
          aria-invalid={!!errors.password} />
      </Field>
      <Field id="reg-confirm" label="Confirmer le mot de passe" error={errors.confirmPassword}>
        <PasswordInput id="reg-confirm" name="confirmPassword" autoComplete="new-password" required
          aria-invalid={!!errors.confirmPassword} />
      </Field>
      <SubmitButton pending={pending}>Créer mon compte</SubmitButton>
    </form>
  );
}

export function AuthForms({
  defaultTab,
  next,
  hasCallbackError,
}: {
  defaultTab: "login" | "register";
  next?: string;
  hasCallbackError?: boolean;
}) {
  const [tab, setTab] = useState(defaultTab);

  useEffect(() => {
    if (hasCallbackError) toast.error("Le lien de confirmation est invalide ou a expiré.");
  }, [hasCallbackError]);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
      <TabsList className="grid h-11 w-full grid-cols-2">
        <TabsTrigger value="login" className="h-9">Connexion</TabsTrigger>
        <TabsTrigger value="register" className="h-9">Inscription</TabsTrigger>
      </TabsList>
      <TabsContent value="login" className="mt-6">
        <LoginForm next={next} />
      </TabsContent>
      <TabsContent value="register" className="mt-6">
        <RegisterForm />
      </TabsContent>
    </Tabs>
  );
}
export default function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const next = typeof searchParams?.next === "string" ? searchParams.next : undefined;
  const hasCallbackError = searchParams?.error === "callback_error";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6 shadow-lg">
        <AuthForms defaultTab="login" next={next} hasCallbackError={hasCallbackError} />
      </div>
    </div>
  );
}