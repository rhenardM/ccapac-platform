"use client";

import {
  useState,
  type FormEvent,
} from "react";
import axios from "axios";
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import {
  internalLogin,
  internalRegister,
  type RegisterData,
  type User,
} from "@/services/auth";

type View = "login" | "register";

const initialRegisterForm: RegisterData = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
};

function getDestination(user: User): string {
  switch (user.role) {
    case "ADMIN":
      return "/espace-membre/admin";
    case "SUPERVISEUR":
      return "/espace-membre/superviseur";
    case "DG":
      return "/espace-membre/dg";
    case "PROGRAMME_SUPERVISEUR":
    case "PROGRAMME_ASSISTANT":
      return "/espace-membre/programme";
    case "REGISSEUR_GENERAL":
      return "/espace-membre/regisseur";
    case "DIRECTION_ARTISTIQUE_SUPERVISEUR":
    case "DIRECTION_ARTISTIQUE_ASSISTANT":
      return "/espace-membre/direction-artistique";
    case "COMMUNICATION":
      return "/espace-membre/communication";
    case "JURIDIQUE_SUPERVISEUR":
    case "JURIDIQUE_ASSISTANT":
      return "/espace-membre/juridique";
    case "FINANCE":
      return "/espace-membre/finance";
    default:
      return "/espace-membre";
  }
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string" && message) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}

export default function InternalAuthPage() {
  const [view, setView] = useState<View>("login");
  const [showPassword, setShowPassword] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] =
    useState<RegisterData>(initialRegisterForm);

  const changeView = (nextView: View) => {
    setView(nextView);
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await internalLogin(
        loginForm.email,
        loginForm.password
      );

      const sessionResponse = await fetch(
        "/api/auth/session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: result.token,
          }),
        }
      );

      if (!sessionResponse.ok) {
        throw new Error(
          "Impossible de créer la session."
        );
      }

      localStorage.setItem("token", result.token);
      localStorage.setItem(
        "user",
        JSON.stringify(result.user)
      );

      /*
       * Une navigation complète est volontaire ici : elle remonte
       * AuthProvider et lui permet de relire immédiatement le token et
       * l'utilisateur enregistrés dans localStorage. Une navigation client
       * conserverait l'ancien état `user = null` et le layout protégé
       * renverrait alors vers la page de connexion publique.
       */
      window.location.assign(
        getDestination(result.user)
      );
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await internalRegister(
        registerForm
      );

      setSuccess(result.message);
      setRegisterForm(initialRegisterForm);
    } catch (registerError) {
      setError(getErrorMessage(registerError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#2D1B14] px-4 py-10">
      <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#D1965B]/20 blur-3xl" />
      <div className="absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-[#E7B57F]/15 blur-3xl" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden bg-[#5C4033] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D1965B]/35 blur-3xl" />

          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D1965B] shadow-lg shadow-black/10">
              <Building2 className="h-7 w-7" />
            </div>

            <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#E7B57F]">
              Accès interne CCAPAC
            </p>

            <h1 className="mt-4 text-4xl font-black leading-tight">
              Espace réservé à l’équipe de validation
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
              Utilisez uniquement votre adresse professionnelle se terminant par @centreculturel.cd.
            </p>
          </div>

          <div className="relative rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#E7B57F]" />
              <p className="text-sm leading-6 text-white/75">
                Après la création et la vérification du compte, un administrateur doit attribuer votre rôle avant votre première connexion.
              </p>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D1965B] text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#D1965B]">
                  Accès interne
                </p>
                <p className="font-bold text-[#5C4033]">
                  CCAPAC
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 rounded-2xl bg-[#F3EEE5] p-1 lg:mt-0">
              <button
                type="button"
                onClick={() => changeView("login")}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  view === "login"
                    ? "bg-white text-[#5C4033] shadow-sm"
                    : "text-[#5C4033]/55 hover:text-[#5C4033]"
                }`}
              >
                Se connecter
              </button>

              <button
                type="button"
                onClick={() => changeView("register")}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  view === "register"
                    ? "bg-white text-[#5C4033] shadow-sm"
                    : "text-[#5C4033]/55 hover:text-[#5C4033]"
                }`}
              >
                Créer un compte
              </button>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-black text-[#5C4033] sm:text-3xl">
                {view === "login"
                  ? "Connexion interne"
                  : "Créer un compte interne"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#5C4033]/60">
                {view === "login"
                  ? "Accédez à votre espace de traitement des demandes."
                  : "Votre compte restera en attente jusqu’à l’attribution d’un rôle par un administrateur."}
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {view === "login" ? (
              <form
                onSubmit={handleLogin}
                className="mt-7 space-y-5"
              >
                <div>
                  <label
                    htmlFor="internal-login-email"
                    className="text-sm font-bold text-[#5C4033]"
                  >
                    Adresse professionnelle
                  </label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D1965B]" />
                    <input
                      id="internal-login-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="nom@centreculturel.cd"
                      value={loginForm.email}
                      onChange={(event) =>
                        setLoginForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-[#D1965B]/25 bg-white pl-10 pr-4 text-sm text-[#5C4033] outline-none transition placeholder:text-[#5C4033]/35 focus:border-[#D1965B] focus:ring-4 focus:ring-[#D1965B]/10"
                    />
                  </div>
                </div>

                <PasswordField
                  id="internal-login-password"
                  value={loginForm.password}
                  showPassword={showPassword}
                  onToggle={() =>
                    setShowPassword((value) => !value)
                  }
                  onChange={(value) =>
                    setLoginForm((current) => ({
                      ...current,
                      password: value,
                    }))
                  }
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-[#D1965B] px-5 text-sm font-bold text-white transition hover:bg-[#B97D47] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <LockKeyhole className="mr-2 h-4 w-4" />
                      Se connecter
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleRegister}
                className="mt-7 space-y-5"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    id="internal-first-name"
                    label="Prénom"
                    value={registerForm.first_name}
                    autoComplete="given-name"
                    onChange={(value) =>
                      setRegisterForm((current) => ({
                        ...current,
                        first_name: value,
                      }))
                    }
                  />

                  <TextField
                    id="internal-last-name"
                    label="Nom"
                    value={registerForm.last_name}
                    autoComplete="family-name"
                    onChange={(value) =>
                      setRegisterForm((current) => ({
                        ...current,
                        last_name: value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="internal-register-email"
                    className="text-sm font-bold text-[#5C4033]"
                  >
                    Adresse professionnelle
                  </label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D1965B]" />
                    <input
                      id="internal-register-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="nom@centreculturel.cd"
                      value={registerForm.email}
                      onChange={(event) =>
                        setRegisterForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="h-12 w-full rounded-xl border border-[#D1965B]/25 bg-white pl-10 pr-4 text-sm text-[#5C4033] outline-none transition placeholder:text-[#5C4033]/35 focus:border-[#D1965B] focus:ring-4 focus:ring-[#D1965B]/10"
                    />
                  </div>
                </div>

                <TextField
                  id="internal-phone"
                  label="Téléphone (facultatif)"
                  value={registerForm.phone || ""}
                  type="tel"
                  required={false}
                  autoComplete="tel"
                  onChange={(value) =>
                    setRegisterForm((current) => ({
                      ...current,
                      phone: value,
                    }))
                  }
                />

                <PasswordField
                  id="internal-register-password"
                  value={registerForm.password}
                  showPassword={showPassword}
                  onToggle={() =>
                    setShowPassword((value) => !value)
                  }
                  onChange={(value) =>
                    setRegisterForm((current) => ({
                      ...current,
                      password: value,
                    }))
                  }
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-[#D1965B] px-5 text-sm font-bold text-white transition hover:bg-[#B97D47] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Créer mon compte
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
};

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = true,
  autoComplete,
}: TextFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-bold text-[#5C4033]"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 h-12 w-full rounded-xl border border-[#D1965B]/25 bg-white px-4 text-sm text-[#5C4033] outline-none transition focus:border-[#D1965B] focus:ring-4 focus:ring-[#D1965B]/10"
      />
    </div>
  );
}

type PasswordFieldProps = {
  id: string;
  value: string;
  showPassword: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
};

function PasswordField({
  id,
  value,
  showPassword,
  onToggle,
  onChange,
}: PasswordFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-bold text-[#5C4033]"
      >
        Mot de passe
      </label>
      <div className="relative mt-2">
        <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D1965B]" />
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          required
          minLength={6}
          autoComplete={
            id.includes("register")
              ? "new-password"
              : "current-password"
          }
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-12 w-full rounded-xl border border-[#D1965B]/25 bg-white pl-10 pr-12 text-sm text-[#5C4033] outline-none transition focus:border-[#D1965B] focus:ring-4 focus:ring-[#D1965B]/10"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            showPassword
              ? "Masquer le mot de passe"
              : "Afficher le mot de passe"
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#5C4033]/45 transition hover:bg-[#F3EEE5] hover:text-[#5C4033]"
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
