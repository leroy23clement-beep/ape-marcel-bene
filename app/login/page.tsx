import Image from "next/image";
import AuthForms from "./AuthForms";

/**
 * Page de connexion / inscription — composant **serveur**.
 *
 * Avant, le fichier portait « use client » et son export par défaut était
 * `async` : React ne peut pas suspendre un composant client sur une promesse,
 * d'où les deux erreurs dans la console
 * (« <LoginPage> is an async Client Component » et
 * « A component was suspended by an uncached promise »).
 * Seule la partie interactive est maintenant un composant client
 * (`AuthForms`), et les `searchParams` sont lus ici.
 */
export default async function LoginPage({
  searchParams,
}: {
  // Next 16 : `searchParams` est une Promise. Le typer en objet synchrone
  // faisait que `searchParams.next` et `searchParams.error` valaient toujours
  // undefined (message d'erreur de callback et `?next=` perdus).
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = (await searchParams) ?? {};
  const next = typeof params.next === "string" ? params.next : undefined;
  const hasCallbackError = params.error === "callback_error";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6 shadow-lg">
        <div className="flex flex-col items-center justify-center pb-2">
          <Image
            src="/logo.jpg"
            alt="Logo APE"
            width={200}
            height={200}
            priority
            className="rounded-full object-contain"
          />
        </div>

        <AuthForms defaultTab="login" next={next} hasCallbackError={hasCallbackError} />
      </div>
    </div>
  );
}
