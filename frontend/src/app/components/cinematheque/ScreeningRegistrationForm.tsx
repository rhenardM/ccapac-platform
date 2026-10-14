"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
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
import { registerForScreening } from "@/actions/screeningRegistration";

const formSchema = z.object({
  firstName: z.string().trim().min(2, {
    message: "Le prénom doit contenir au moins 2 caractères",
  }),
  lastName: z.string().trim().min(2, {
    message: "Le nom doit contenir au moins 2 caractères",
  }),
  email: z.string().trim().email({ message: "Veuillez entrer un email valide" }),
  phone: z.string().trim().optional(),
  gender: z.string().trim().optional(),
  ageRange: z.string().trim().optional(),
  numberOfSeats: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

const AGE_RANGES = ["0-12", "13-17", "18-25", "26-40", "41-60", "60+"] as const;

interface ScreeningRegistrationFormProps {
  screeningId: number;
  screeningLabel: string;
  triggerClassName?: string;
}

/**
 * Bouton "S'inscrire" ouvrant un formulaire léger, pour les séances de
 * cinémathèque gratuites (inscription anonyme, pas de compte membre requis).
 * Redirige vers la page de confirmation/billet une fois l'inscription validée.
 */
export default function ScreeningRegistrationForm({
  screeningId,
  screeningLabel,
  triggerClassName,
}: ScreeningRegistrationFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "",
      ageRange: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const seats = values.numberOfSeats ? parseInt(values.numberOfSeats, 10) : undefined;
      const result = await registerForScreening(screeningId, {
        ...values,
        numberOfSeats: seats && Number.isFinite(seats) ? seats : undefined,
      });

      setOpen(false);
      form.reset();

      if (result.ticketViewUrl) {
        router.push(result.ticketViewUrl);
      } else {
        // Inscription réussie mais billet indisponible (cas rare) : le
        // participant reste inscrit, on l'en informe sans bloquer.
        toast.success("Inscription enregistrée !", {
          description: "Merci, nous avons bien reçu votre inscription.",
        });
      }
    } catch {
      toast.error("L'inscription a échoué", {
        description: "Une erreur est survenue. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={triggerClassName}>S’inscrire</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>S’inscrire à « {screeningLabel} »</DialogTitle>
          <DialogDescription>
            Séance gratuite — remplissez ce formulaire pour réserver votre place.
          </DialogDescription>
        </DialogHeader>

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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold sm:text-sm">
                      Sexe (facultatif)
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="F">Femme</SelectItem>
                        <SelectItem value="M">Homme</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ageRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold sm:text-sm">
                      Tranche d’âge (facultatif)
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AGE_RANGES.map((range) => (
                          <SelectItem key={range} value={range}>
                            {range} ans
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
      </DialogContent>
    </Dialog>
  );
}
