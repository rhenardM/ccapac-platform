import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header Skeleton */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-xl md:rounded-2xl p-4 md:p-8 shadow-sm border border-primary/10">
        <Skeleton className="h-8 md:h-10 w-48 mb-2" />
        <Skeleton className="h-5 md:h-6 w-64" />
      </div>

      {/* Profile Header Card Skeleton */}
      <Card className="overflow-hidden py-4">
        <CardHeader className="pb-4 md:pb-8 px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
            <Skeleton className="w-16 h-16 md:w-24 md:h-24 rounded-full" />
            <div className="flex-1 text-center md:text-left space-y-3">
              <Skeleton className="h-7 md:h-9 w-48 mx-auto md:mx-0" />
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-56 mx-auto md:mx-0" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information Skeleton */}
      <Card className="py-4">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 md:h-5 md:w-5" />
            <Skeleton className="h-5 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg"
              >
                <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Membership Information Skeleton */}
      <Card className="py-4">
        <CardHeader className="px-4 md:px-6">
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 md:h-5 md:w-5" />
            <Skeleton className="h-5 w-56" />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg"
              >
                <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
