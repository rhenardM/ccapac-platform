"use client";

import {
  useForm,
} from "react-hook-form";
import {
  zodResolver,
} from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
const signupSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "Prénom requis"),

  lastName: z
    .string()
    .trim()
    .min(1, "Nom requis"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email invalide"),

  phone: z
    .string()
    .trim()
    .optional(),

  password: z
    .string()
    .min(
      6,
      "Au moins 6 caractères"
    ),
});

export type SignupFormValues =
  z.infer<typeof signupSchema>;

interface SignupFormProps {
  initialEmail?: string;
  onSubmit: (
    values: SignupFormValues
  ) => Promise<void>;
  loading?: boolean;
}

export default function SignupForm({
  initialEmail = "",
  onSubmit,
  loading = false,
}: SignupFormProps) {
  const form =
    useForm<SignupFormValues>({
      resolver:
        zodResolver(signupSchema),

      defaultValues: {
        firstName: "",
        lastName: "",
        email: initialEmail
          .trim()
          .toLowerCase(),
        phone: "",
        password: "",
      },
    });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(
          onSubmit
        )}
        className="space-y-4"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Prénom
                </FormLabel>

                <FormControl>
                  <Input
                    placeholder="Votre prénom"
                    autoComplete="given-name"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nom
                </FormLabel>

                <FormControl>
                  <Input
                    placeholder="Votre nom"
                    autoComplete="family-name"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Adresse email
              </FormLabel>

              <FormControl>
                <Input
                  type="email"
                  inputMode="email"
                  placeholder="prenom.nom@exemple.com"
                  autoComplete="email"
                  disabled={loading}
                  {...field}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value
                        .trimStart()
                        .toLowerCase()
                    )
                  }
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Téléphone
              </FormLabel>

              <FormControl>
                <Input
                  type="tel"
                  placeholder="+243 000 000 000"
                  autoComplete="tel"
                  disabled={loading}
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Mot de passe
              </FormLabel>

              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading
            ? "Création..."
            : "Créer mon compte"}
        </Button>
      </form>
    </Form>
  );
}