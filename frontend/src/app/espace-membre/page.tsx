import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Calendar,
  Clock,
  // CheckCircle2,
  User,
  Activity,
  LogIn,
  UserPlus,
  FileEdit,
  XCircle,
  Settings,
  Mail,
  MessageSquare,
} from "lucide-react";
import { getUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getUser();

  // Vérifier que l'utilisateur existe (devrait être géré par le layout, mais sécurité supplémentaire)
  if (!user) {
    redirect("/auth/login");
  }

  if (user.role === "ADMIN") {
    redirect("/espace-membre/admin");
  }

  const [eventsRegistered, recentActivities] = await Promise.all([
    // Nombre d'événements inscrits
    prisma.eventRegistration.count({
      where: {
        userId: user.dbUserId,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
    }),
    // 5 dernières activités
    prisma.memberActivity.findMany({
      where: { userId: user.dbUserId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // const confirmedEvents = await prisma.eventRegistration.count({
  //   where: {
  //     userId: user!.id,
  //     status: "CONFIRMED",
  //   },
  // });

  const memberSince = new Date(user.createdAt).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const stats = [
    {
      title: "Événements Inscrits",
      value: eventsRegistered.toString(),
      icon: Calendar,
      description: "Inscriptions en cours",
      className: "text-blue-600 bg-blue-50",
    },
    // {
    //   title: "Événements Confirmés",
    //   value: confirmedEvents.toString(),
    //   icon: CheckCircle2,
    //   description: "Participation assurée",
    //   className: "text-green-600 bg-green-50",
    // },
    {
      title: "Activités Récentes",
      value: recentActivities.length.toString(),
      icon: Clock,
      description: "Dernières actions",
      className: "text-purple-600 bg-purple-50",
    },
    {
      title: "Statut Membre",
      value: user.emailVerified ? "Actif" : "Email non vérifié",
      icon: User,
      description: `Membre depuis ${memberSince.split(" ")[2]}`,
      className: "text-orange-600 bg-orange-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Bienvenue, {user.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Heureux de vous revoir. Voici une mise à jour de votre aperçu.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground bg-white px-4 py-2 rounded-full border shadow-sm">
          <User size={16} />
          <span>Membre depuis le {memberSince}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="border-none shadow-sm hover:shadow-md transition-all duration-200 bg-white py-4"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={cn("p-2 rounded-full", stat.className)}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activities - Takes full width if no newsletter, otherwise 2/3 */}
        <div
          className={cn(
            "space-y-4",
            user.newsletterOptIn ? "lg:col-span-2" : "lg:col-span-3"
          )}
        >
          <h2 className="text-xl font-semibold tracking-tight">
            Activités Récentes
          </h2>
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardContent className="p-0">
              {recentActivities.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {recentActivities.map((activity) => {
                    const getActivityIcon = (type: string) => {
                      switch (type) {
                        case "SIGNUP":
                          return UserPlus;
                        case "LOGIN":
                          return LogIn;
                        case "PROFILE_UPDATE":
                          return FileEdit;
                        case "EVENT_REGISTER":
                          return Calendar;
                        case "EVENT_CANCEL":
                          return XCircle;
                        case "ADMIN_ACTION":
                          return Settings;
                        case "SUGGESTION_SUBMIT":
                          return MessageSquare;
                        default:
                          return Activity;
                      }
                    };

                    const getActivityLabel = (type: string) => {
                      switch (type) {
                        case "SIGNUP":
                          return "Inscription au site";
                        case "LOGIN":
                          return "Connexion";
                        case "PROFILE_UPDATE":
                          return "Mise à jour du profil";
                        case "EVENT_REGISTER":
                          return "Inscription à un événement";
                        case "EVENT_CANCEL":
                          return "Annulation d'un événement";
                        case "ADMIN_ACTION":
                          return "Action administrative";
                        case "SUGGESTION_SUBMIT":
                          return "Suggestion envoyée";
                        default:
                          return "Activité";
                      }
                    };

                    const Icon = getActivityIcon(activity.type);

                    return (
                      <div
                        key={activity.id}
                        className="flex items-center p-4 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex-shrink-0 mr-4">
                          <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Icon size={18} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {getActivityLabel(activity.type)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "numeric",
                                month: "long",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase tracking-wider font-normal bg-muted text-muted-foreground"
                        >
                          {activity.type}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <Activity className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground">
                    Aucune activité récente
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vos actions apparaîtront ici
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Extra Info - Only rendered if needed */}
        {user.newsletterOptIn && (
          <div className="space-y-6 lg:col-span-1">
            <div className="lg:pt-11">
              {" "}
              {/* Align with content below header */}
              <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm mb-1">
                        Newsletter Active
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Vous recevez nos actualités et informations sur les
                        événements à venir.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
