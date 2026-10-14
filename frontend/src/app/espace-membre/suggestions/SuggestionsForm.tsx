"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  suggestionCategories,
  suggestionCategoryLabels,
  suggestionSchema,
  type SuggestionFormValues,
} from "@/lib/suggestions";
import { createSuggestionAction } from "./actions";

export function SuggestionsForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SuggestionFormValues>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      category: "PROGRAMMATION",
      message: "",
    },
  });

  const onSubmit = async (values: SuggestionFormValues) => {
    setIsSubmitting(true);

    try {
      const result = await createSuggestionAction(values);

      if (result.success) {
        toast.success(result.message || "Suggestion envoyée");
        form.reset({
          category: "PROGRAMMATION",
          message: "",
        });
      } else {
        toast.error(result.error || "Impossible d'envoyer la suggestion");
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur inattendue s'est produite");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {suggestionCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {suggestionCategoryLabels[category]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  rows={7}
                  placeholder="Partagez votre suggestion, votre remarque ou une idée pour améliorer l'expérience des membres."
                  className="resize-none bg-white"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Envoyer la suggestion
        </Button>
      </form>
    </Form>
  );
}
