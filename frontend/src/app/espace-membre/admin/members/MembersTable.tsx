"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Loader2,
  AlertTriangle,
  MoreHorizontal,
  Mail,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteMemberAction } from "./actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "MEMBER" | "ADMIN";
  emailVerified: boolean;
  createdAt: Date;
  _count: {
    activities: number;
  };
}

interface MembersTableProps {
  members: Member[];
}

export function MembersTable({ members }: MembersTableProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    setDeletingId(memberToDelete.id);
    setMemberToDelete(null);

    try {
      const result = await deleteMemberAction(memberToDelete.id);
      if (result.success) {
        toast.success(result.message || "Membre supprimé avec succès");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["admin", "members"] }),
          queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }),
        ]);
      } else {
        toast.error(result.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Une erreur inattendue s'est produite");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <AlertDialog
        open={memberToDelete !== null}
        onOpenChange={(open: boolean) => !open && setMemberToDelete(null)}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl">
                Supprimer un membre
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base text-left">
              Êtes-vous sûr de vouloir supprimer{" "}
              <span className="font-semibold text-foreground">
                {memberToDelete?.name}
              </span>{" "}
              ?
              <br />
              <br />
              <span className="text-red-600 font-medium">
                Cette action est irréversible.
              </span>{" "}
              Toutes les données associées à ce membre seront définitivement
              supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 cursor-pointer hover:bg-red-700 focus:ring-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Oui, supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-gray-50/50">
            <tr>
              <th className="py-3 px-6 font-medium">Membre</th>
              <th className="py-3 px-6 font-medium">Rôle</th>
              <th className="py-3 px-6 font-medium">Date d&apos;inscription</th>
              <th className="py-3 px-6 font-medium text-center">Activités</th>
              <th className="py-3 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground"
                >
                  Aucun membre trouvé
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  <td className="py-3 px-6">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {member.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex items-center gap-1.5">
                      {member.role === "ADMIN" ? (
                        <Shield className="h-3.5 w-3.5 text-primary" />
                      ) : null}
                      <span
                        className={cn(
                          "text-xs font-medium",
                          member.role === "ADMIN"
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        {member.role === "ADMIN" ? "Admin" : "Membre"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {member._count.activities}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => {
                            window.location.href = `mailto:${member.email}`;
                          }}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Envoyer un email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                          onClick={() =>
                            setMemberToDelete({
                              id: member.id,
                              name: member.name,
                            })
                          }
                          disabled={deletingId === member.id}
                        >
                          {deletingId === member.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Supprimer le compte
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
