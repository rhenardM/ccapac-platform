"use client";

import { startTransition, useState} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "@/components/ui/input";
import { Search} from "lucide-react";

interface MembersFiltersProps {
  currentSearch: string;
  currentStatus: string;
}

export function MembersFilters({
  currentSearch,
}: MembersFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`/espace-membre/admin/members?${params.toString()}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters("search", searchTerm);
  };

  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </form>

        </div>
      </CardContent>
    </Card>
  );
}
