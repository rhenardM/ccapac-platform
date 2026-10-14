import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Welcome Section Skeleton */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-xl md:rounded-2xl p-4 md:p-8 shadow-sm border border-primary/10 md:mt-0 mt-4">
        <Skeleton className="h-8 md:h-10 w-3/4 mb-3" />
        <Skeleton className="h-5 md:h-6 w-1/2" />
        <div className="mt-3 md:mt-4 flex flex-wrap gap-2 md:gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="relative overflow-hidden py-3 md:py-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 md:px-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-lg" />
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <Skeleton className="h-8 md:h-10 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities Skeleton */}
      <div>
        <Skeleton className="h-7 md:h-8 w-48 mb-3 md:mb-4" />
        <Card className="overflow-hidden py-4">
          <CardContent className="p-0">
            <div className="divide-y">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 md:p-4 gap-2"
                >
                  <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                    <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-full flex-shrink-0" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 hidden sm:block" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
