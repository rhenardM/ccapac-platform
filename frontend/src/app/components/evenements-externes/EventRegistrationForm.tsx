"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { registerForProgram } from "@/actions/programRegistration";

const formSchema = z.object({
  firstName: z.string().trim().min(2, {
    message: "Le prénom doit contenir au moins 2 caractères",
  }),
  lastName: z.string().trim().min(2, {
    message: "Le nom doit contenir au moins 2 caractères",
  }),
  email: z.string().trim().email({ message: "Veuillez entrer un email valide" }),
  phone: z.string().trim().optional(),
  numberOfSeats: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

interface EventRegistrationFormProps {
  programSlug: string;
  programTitle: string;
  triggerClassName?: string;
}

/**
 * Bouton "S'inscrire" ouvrant un formulaire léger, pour les événements
 * externes gratuits (inscription anonyme, pas de compte membre requis).
 */
export default function EventRegistrationForm({
  programSlug,
  programTitle,
  triggerClassName,
}: EventRegistrationFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const seats = values.numberOfSeats ? parseInt(values.numberOfSeats, 10) : undefined;
      await registerForProgram(programSlug, {
        ...values,
        numberOfSeats: seats && Number.isFinite(seats) ? seats : undefined,
      });
      setSuccess(true);
      form.reset();
      toast.success("Inscription enregistrée !", {
        description: "Merci, nous avons bien reçu votre inscription.",
      });
    } catch {
      toast.error("L'inscription a échoué", {
        description: "Une erreur est survenue. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSuccess(false);
      }}
    >
      <DialogTrigger asChild>
        <Button className={triggerClassName}>S’inscrire</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>S’inscrire à « {programTitle} »</DialogTitle>
          <DialogDescription>
            Événement gratuit — remplissez ce formulaire pour réserver votre place.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <p className="text-sm text-muted-foreground">
              Votre inscription a bien été enregistrée. À bientôt !
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold sm:text-sm">
                        Prénom
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Votre prénom" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold sm:text-sm">
                        Nom
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Votre nom" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold sm:text-sm">
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="votre@email.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold sm:text-sm">
                        Téléphone (facultatif)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Votre numéro"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="numberOfSeats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold sm:text-sm">
                      Nombre de places (facultatif)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        placeholder="1"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold sm:text-sm">
                      Message (facultatif)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Une précision à nous communiquer ?"
                        rows={3}
                        className="resize-none"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Confirmer mon inscription"
                )}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
