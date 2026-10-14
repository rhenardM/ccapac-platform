"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  ASSIGNABLE_ROLES,
  supervisorService,
  type AssignableRole,
  type SupervisedUser,
} from "../supervisorService";

interface UserGroup {
  id: string;
  title: string;
  description: string;
  roles: AssignableRole[];
}

const USER_GROUPS: UserGroup[] = [
  {
    id: "members",
    title: "Membres",
    description:
      "Tous les utilisateurs membres",
    roles: ["MEMBER"],
  },
  {
    id: "programme",
    title: "Programme",
    description:
      "Superviseurs et assistants Programme",
    roles: [
      "PROGRAMME_SUPERVISEUR",
      "PROGRAMME_ASSISTANT",
    ],
  },
  {
    id: "regisseur",
    title: "Régisseur général",
    description:
      "Utilisateurs de la Régie générale",
    roles: ["REGISSEUR_GENERAL"],
  },
  {
    id: "direction-artistique",
    title: "Direction artistique",
    description:
      "Superviseurs et assistants artistiques",
    roles: [
      "DIRECTION_ARTISTIQUE_SUPERVISEUR",
      "DIRECTION_ARTISTIQUE_ASSISTANT",
    ],
  },
  {
    id: "communication",
    title: "Communication",
    description:
      "Utilisateurs du service Communication",
    roles: ["COMMUNICATION"],
  },
  {
    id: "juridique",
    title: "Juridique",
    description:
      "Superviseurs et assistants juridiques",
    roles: [
      "JURIDIQUE_SUPERVISEUR",
      "JURIDIQUE_ASSISTANT",
    ],
  },
  {
    id: "finance",
    title: "Finance",
    description:
      "Utilisateurs du service Finance",
    roles: ["FINANCE"],
  },
  {
    id: "superviseurs",
    title: "Superviseurs généraux",
    description:
      "Utilisateurs ayant accès à la supervision",
    roles: ["SUPERVISEUR"],
  },
  {
    id: "direction-generale",
    title: "Direction générale",
    description: "Utilisateur chargé d’approuver les cotations",
    roles: ["DG"],
  },
];

const ROLE_LABELS: Record<
  AssignableRole,
  string
> = {
  MEMBER: "Membre",
  PROGRAMME_SUPERVISEUR:
    "Superviseur Programme",
  PROGRAMME_ASSISTANT:
    "Assistant Programme",
  REGISSEUR_GENERAL:
    "Régisseur général",
  DIRECTION_ARTISTIQUE_SUPERVISEUR:
    "Superviseur Direction artistique",
  DIRECTION_ARTISTIQUE_ASSISTANT:
    "Assistant Direction artistique",
  COMMUNICATION: "Communication",
  JURIDIQUE_SUPERVISEUR:
    "Superviseur Juridique",
  JURIDIQUE_ASSISTANT:
    "Assistant Juridique",
  FINANCE: "Finance",
  SUPERVISEUR: "Superviseur général",
  DG: "Directeur général",
};

function isAssignableRole(
  value: string
): value is AssignableRole {
  return (
    ASSIGNABLE_ROLES as readonly string[]
  ).includes(value);
}

function getUserName(
  user: SupervisedUser
): string {
  const fullName = [
    user.first_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Utilisateur sans nom";
}

function getErrorMessage(
  error: unknown
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur est survenue.";
}

export default function SupervisorUsersPage() {
  const [users, setUsers] = useState<
    SupervisedUser[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [selectedGroup, setSelectedGroup] =
    useState("members");

  const [selectedRoles, setSelectedRoles] =
    useState<Record<number, AssignableRole>>(
      {}
    );

  const [updatingUserId, setUpdatingUserId] =
    useState<number | null>(null);

  const [deletingUserId, setDeletingUserId] =
    useState<number | null>(null);

  const [resettingUserId, setResettingUserId] =
    useState<number | null>(null);

  const loadUsers = useCallback(
    async (showSuccess = false) => {
      try {
        setLoading(true);

        const data =
          await supervisorService.getUsers();

        setUsers(data);

        const roles: Record<
          number,
          AssignableRole
        > = {};

        data.forEach((user) => {
          if (isAssignableRole(user.role)) {
            roles[user.id] = user.role;
          }
        });

        setSelectedRoles(roles);

        if (showSuccess) {
          toast.success(
            "La liste des utilisateurs a été actualisée."
          );
        }
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const currentGroup =
    USER_GROUPS.find(
      (group) => group.id === selectedGroup
    ) || USER_GROUPS[0];

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return users
      .filter((user) =>
        currentGroup.roles.includes(
          user.role as AssignableRole
        )
      )
      .filter((user) => {
        if (!normalizedSearch) {
          return true;
        }

        const searchableText = [
          user.first_name,
          user.last_name,
          user.email,
          user.role,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          normalizedSearch
        );
      })
      .sort((firstUser, secondUser) =>
        getUserName(firstUser).localeCompare(
          getUserName(secondUser),
          "fr",
          {
            sensitivity: "base",
          }
        )
      );
  }, [
    users,
    currentGroup.roles,
    search,
  ]);

  function countGroupUsers(
    group: UserGroup
  ): number {
    return users.filter((user) =>
      group.roles.includes(
        user.role as AssignableRole
      )
    ).length;
  }

  function handleSelectedRoleChange(
    userId: number,
    role: AssignableRole
  ) {
    setSelectedRoles((previous) => ({
      ...previous,
      [userId]: role,
    }));
  }

  async function handleUpdateRole(
    user: SupervisedUser
  ) {
    const selectedRole =
      selectedRoles[user.id];

    if (!selectedRole) {
      toast.error(
        "Veuillez sélectionner un rôle."
      );
      return;
    }

    if (selectedRole === user.role) {
      toast.info(
        "Cet utilisateur possède déjà ce rôle."
      );
      return;
    }

    const confirmed = window.confirm(
      `Voulez-vous attribuer le rôle « ${ROLE_LABELS[selectedRole]} » à ${getUserName(user)} ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingUserId(user.id);

      const updatedUser =
        await supervisorService.assignRole(
          user.id,
          selectedRole
        );

      setUsers((previous) =>
        previous.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                ...updatedUser,
              }
            : currentUser
        )
      );

      setSelectedRoles((previous) => ({
        ...previous,
        [user.id]: selectedRole,
      }));

      toast.success(
        "Le rôle de l’utilisateur a été modifié."
      );
    } catch (error) {
      setSelectedRoles((previous) => ({
        ...previous,
        [user.id]: isAssignableRole(
          user.role
        )
          ? user.role
          : "MEMBER",
      }));

      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleResetPassword(
    user: SupervisedUser
  ) {
    const newPassword = window.prompt(
      `Entrez le nouveau mot de passe de ${getUserName(user)}.\n\nIl doit contenir au moins 8 caractères.`
    );

    if (newPassword === null) {
      return;
    }

    if (newPassword.trim().length < 8) {
      toast.error(
        "Le mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    const confirmed = window.confirm(
      `Confirmez-vous la réinitialisation du mot de passe de ${getUserName(user)} ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setResettingUserId(user.id);

      await supervisorService.resetPassword(
        user.id,
        newPassword.trim()
      );

      toast.success(
        "Le mot de passe a été réinitialisé."
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setResettingUserId(null);
    }
  }

  async function handleDeleteUser(
    user: SupervisedUser
  ) {
    const confirmed = window.confirm(
      `Voulez-vous supprimer définitivement ${getUserName(user)} ?\n\nCette action est irréversible.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingUserId(user.id);

      await supervisorService.deleteUser(
        user.id
      );

      setUsers((previous) =>
        previous.filter(
          (currentUser) =>
            currentUser.id !== user.id
        )
      );

      setSelectedRoles((previous) => {
        const nextRoles = {
          ...previous,
        };

        delete nextRoles[user.id];

        return nextRoles;
      });

      toast.success(
        "L’utilisateur a été supprimé."
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingUserId(null);
    }
  }

  const verifiedUsers = users.filter(
    (user) => Boolean(user.email_verified)
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f5f2] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="relative overflow-hidden rounded-[28px] bg-[#3f2c22] px-5 py-6 text-white shadow-[0_18px_50px_rgba(63,44,34,0.18)] sm:px-7 lg:px-9 lg:py-8">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#d1965b]/25 blur-3xl" />
          <div className="absolute -bottom-28 right-1/3 h-52 w-52 rounded-full bg-white/5 blur-2xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#f5d8bd]">
                <ShieldCheck className="h-4 w-4" />
                Espace de supervision
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Gestion des utilisateurs
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                Gérez les accès, les rôles et la
                sécurité des comptes depuis un seul
                espace.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-[95px] rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-3 backdrop-blur-sm sm:min-w-[125px] sm:px-4">
                <p className="text-xl font-bold sm:text-2xl">
                  {users.length}
                </p>
                <p className="mt-1 text-[11px] text-white/55 sm:text-xs">
                  Utilisateurs
                </p>
              </div>

              <div className="min-w-[95px] rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-3 backdrop-blur-sm sm:min-w-[125px] sm:px-4">
                <p className="text-xl font-bold text-[#f0be8f] sm:text-2xl">
                  {verifiedUsers}
                </p>
                <p className="mt-1 text-[11px] text-white/55 sm:text-xs">
                  Emails vérifiés
                </p>
              </div>

              <div className="min-w-[95px] rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-3 backdrop-blur-sm sm:min-w-[125px] sm:px-4">
                <p className="text-xl font-bold sm:text-2xl">
                  {USER_GROUPS.length}
                </p>
                <p className="mt-1 text-[11px] text-white/55 sm:text-xs">
                  Services
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[275px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[24px] border border-[#e9e2dc] bg-white p-3 shadow-[0_8px_30px_rgba(63,44,34,0.06)] xl:sticky xl:top-6">
            <div className="px-3 pb-3 pt-2">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9a877b]">
                Services
              </p>
              <p className="mt-1 text-sm text-[#74645b]">
                Filtrer les utilisateurs
              </p>
            </div>

            <nav className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible">
              {USER_GROUPS.map((group) => {
                const active =
                  group.id === selectedGroup;
                const count = countGroupUsers(group);

                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroup(group.id);
                      setSearch("");
                    }}
                    className={`group flex min-w-[190px] items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition xl:min-w-0 ${
                      active
                        ? "bg-[#3f2c22] text-white shadow-md"
                        : "text-[#5c4033] hover:bg-[#f7f2ed]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {group.title}
                      </span>
                      <span
                        className={`mt-0.5 block truncate text-[11px] ${
                          active
                            ? "text-white/55"
                            : "text-[#9a877b]"
                        }`}
                      >
                        {group.description}
                      </span>
                    </span>

                    <span
                      className={`flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-2 text-xs font-bold ${
                        active
                          ? "bg-[#d1965b] text-white"
                          : "bg-[#f2ebe5] text-[#8b6044]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0 overflow-hidden rounded-[24px] border border-[#e9e2dc] bg-white shadow-[0_8px_30px_rgba(63,44,34,0.06)]">
            <div className="border-b border-[#eee8e3] p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4e8de] text-[#a76535]">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#3f2c22] sm:text-xl">
                        {currentGroup.title}
                      </h2>
                      <p className="text-xs text-[#8a7a70] sm:text-sm">
                        {filteredUsers.length} utilisateur
                        {filteredUsers.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative min-w-0 sm:w-[300px]">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a877b]" />
                    <input
                      type="search"
                      value={search}
                      onChange={(event) =>
                        setSearch(event.target.value)
                      }
                      placeholder="Nom, email ou rôle..."
                      className="h-11 w-full rounded-xl border border-[#e6ddd6] bg-[#faf8f6] pl-10 pr-4 text-sm text-[#3f2c22] outline-none transition placeholder:text-[#ad9f96] focus:border-[#d1965b] focus:bg-white focus:ring-4 focus:ring-[#d1965b]/10"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void loadUsers(true)}
                    disabled={loading}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#e1d5cc] bg-white px-4 text-sm font-semibold text-[#5c4033] transition hover:border-[#d1965b] hover:bg-[#fbf7f3] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        loading ? "animate-spin" : ""
                      }`}
                    />
                    Actualiser
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-[430px] flex-col items-center justify-center gap-3 text-[#8a7a70]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4e8de]">
                  <Loader2 className="h-7 w-7 animate-spin text-[#a76535]" />
                </div>
                <p className="text-sm font-medium">
                  Chargement des utilisateurs...
                </p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex min-h-[430px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f4e8de]">
                  <Users className="h-8 w-8 text-[#a76535]" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[#3f2c22]">
                  Aucun utilisateur trouvé
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[#8a7a70]">
                  Aucun compte ne correspond à ce
                  service ou à votre recherche.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse">
                  <thead>
                    <tr className="bg-[#faf8f6] text-left">
                      <th className="w-[23%] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a7a70]">
                        Utilisateur
                      </th>
                      <th className="w-[25%] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a7a70]">
                        Email
                      </th>
                      <th className="w-[18%] px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a7a70]">
                        Rôle actuel
                      </th>
                      <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a7a70]">
                        Gestion du compte
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#eee8e3]">
                    {filteredUsers.map((user) => {
                      const selectedRole =
                        selectedRoles[user.id] ||
                        (isAssignableRole(user.role)
                          ? user.role
                          : "MEMBER");
                      const isUpdating =
                        updatingUserId === user.id;
                      const isDeleting =
                        deletingUserId === user.id;
                      const isResetting =
                        resettingUserId === user.id;
                      const actionInProgress =
                        isUpdating || isDeleting || isResetting;
                      const initials = getUserName(user)
                        .split(" ")
                        .slice(0, 2)
                        .map((name) => name.charAt(0))
                        .join("")
                        .toUpperCase();

                      return (
                        <tr
                          key={user.id}
                          className="group transition hover:bg-[#fdfbf9]"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3f2c22] text-xs font-bold text-white shadow-sm">
                                {initials}
                              </div>
                              <p className="font-semibold capitalize text-[#3f2c22]">
                                {getUserName(user)}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm text-[#5f5149]">
                              {user.email}
                            </p>
                            <span
                              className={`mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                                Boolean(user.email_verified)
                                  ? "text-emerald-700"
                                  : "text-amber-700"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  Boolean(user.email_verified)
                                    ? "bg-emerald-500"
                                    : "bg-amber-500"
                                }`}
                              />
                              {Boolean(user.email_verified)
                                ? "Email vérifié"
                                : "Email non vérifié"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="inline-flex rounded-lg border border-[#ead8ca] bg-[#f8eee6] px-2.5 py-1.5 text-[11px] font-bold text-[#8f5831]">
                              {isAssignableRole(user.role)
                                ? ROLE_LABELS[user.role]
                                : user.role}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-nowrap items-center gap-2 whitespace-nowrap">
                              <select
                                value={selectedRole}
                                onChange={(event) =>
                                  handleSelectedRoleChange(
                                    user.id,
                                    event.target.value as AssignableRole
                                  )
                                }
                                disabled={actionInProgress}
                                aria-label={`Nouveau rôle de ${getUserName(user)}`}
                                className="h-9 w-[195px] shrink-0 rounded-lg border border-[#e1d7cf] bg-white px-3 text-xs font-medium text-[#4c3b32] outline-none transition focus:border-[#d1965b] focus:ring-3 focus:ring-[#d1965b]/10 disabled:opacity-50"
                              >
                                {ASSIGNABLE_ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {ROLE_LABELS[role]}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => void handleUpdateRole(user)}
                                disabled={
                                  actionInProgress ||
                                  selectedRole === user.role
                                }
                                title="Enregistrer le nouveau rôle"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d1965b] text-white transition hover:bg-[#b97d47] disabled:cursor-not-allowed disabled:bg-[#e5d5c7]"
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <UserCog className="h-4 w-4" />
                                )}
                              </button>

                              <div className="mx-1 h-6 w-px bg-[#e8dfd8]" />

                              <button
                                type="button"
                                onClick={() => void handleResetPassword(user)}
                                disabled={actionInProgress}
                                title="Réinitialiser le mot de passe"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d9e3f7] bg-[#f4f7fd] text-[#4267a9] transition hover:border-[#b8cbed] hover:bg-[#eaf0fb] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isResetting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ShieldCheck className="h-4 w-4" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => void handleDeleteUser(user)}
                                disabled={actionInProgress}
                                title="Supprimer l’utilisateur"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredUsers.length > 0 && (
              <div className="flex items-center justify-between border-t border-[#eee8e3] bg-[#faf8f6] px-5 py-3 text-xs text-[#8a7a70]">
                <span>
                  {filteredUsers.length} compte
                  {filteredUsers.length !== 1 ? "s" : ""} affiché
                  {filteredUsers.length !== 1 ? "s" : ""}
                </span>
                <span className="hidden sm:inline">
                  Les changements de rôle sont enregistrés individuellement.
                </span>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
