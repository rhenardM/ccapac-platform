"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { FaPaperPlane } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { sendContactEmail } from "@/actions/contact";

// Schema de validation
const formSchema = z.object({
  firstName: z.string().trim().min(2, {
    message: "Le prénom doit contenir au moins 2 caractères",
  }),
  lastName: z.string().trim().min(2, {
    message: "Le nom doit contenir au moins 2 caractères",
  }),
  email: z
    .string()
    .trim()
    .email({ message: "Veuillez entrer un email valide" }),
  phone: z.string().trim().min(10, {
    message: "Le numéro de téléphone doit contenir au moins 10 caractères",
  }),
  subject: z.string().min(1, { message: "Veuillez choisir un sujet" }),
  message: z
    .string()
    .trim()
    .min(10, { message: "Le message doit contenir au moins 10 caractères" }),
});

export default function ContactForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      await sendContactEmail(values);
      form.reset();
      toast.success("Message envoyé !", {
        description: "Merci, nous vous répondrons dans les meilleurs délais.",
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("L'envoi a échoué", {
        description: "Une erreur est survenue. Veuillez réessayer.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm font-semibold">
                  Prénom
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Votre prénom"
                    className="bg-background text-sm sm:text-base h-10 sm:h-11"
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
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm font-semibold">
                  Nom
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Votre nom"
                    className="bg-background text-sm sm:text-base h-10 sm:h-11"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm font-semibold">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    className="bg-background text-sm sm:text-base h-10 sm:h-11"
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
                <FormLabel className="text-xs sm:text-sm font-semibold">
                  Téléphone
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Votre numéro"
                    className="bg-background text-sm sm:text-base h-10 sm:h-11"
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
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm font-semibold">
                Sujet
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger className="bg-background text-sm sm:text-base h-10 sm:h-11">
                    <SelectValue placeholder="Sélectionnez le sujet de votre message" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem
                    value="information-generale"
                    className="text-xs sm:text-sm"
                  >
                    Information générale
                  </SelectItem>
                  <SelectItem
                    value="location-espaces"
                    className="text-xs sm:text-sm"
                  >
                    Location d&apos;`espaces
                  </SelectItem>
                  <SelectItem value="programmation" className="text-xs sm:text-sm">
                    Programmation
                  </SelectItem>
                  <SelectItem value="partenariat" className="text-xs sm:text-sm">
                    Partenariat
                  </SelectItem>
                  <SelectItem value="presse" className="text-xs sm:text-sm">
                    Presse & Médias
                  </SelectItem>
                  <SelectItem value="autre" className="text-xs sm:text-sm">
                    Autre
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs sm:text-sm font-semibold">
                Message
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Comment pouvons-nous vous aider ?"
                  rows={5}
                  className="resize-none bg-background text-sm sm:text-base"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full text-xs sm:text-sm md:text-base h-10 sm:h-11 md:h-12"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
              <span>Envoi en cours...</span>
            </>
          ) : (
            <>
              <span>Démarrer la discussion</span>
              <FaPaperPlane className="ml-1.5 sm:ml-2 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
