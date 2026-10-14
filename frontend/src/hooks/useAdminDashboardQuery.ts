import { useQuery } from "@tanstack/react-query";
import {
  getAdminStats,
  getFundraisingAdminData,
  getMembers,
  getSuggestions,
  type AdminFundraisingResponse,
  type AdminStatsResponse,
  type FundraisingQueryParams,
  type MembersQueryParams,
  type MembersResponse,
  type SuggestionsQueryParams,
  type SuggestionsResponse,
} from "@/services/adminService";

export const useAdminStatsQuery = () =>
  useQuery<AdminStatsResponse, Error>({
    queryKey: ["admin", "stats", "upcomingEvents"],
    queryFn: () => getAdminStats(),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });

export const useMembersQuery = (params: MembersQueryParams) =>
  useQuery<MembersResponse, Error>({
    queryKey: ["admin", "members", params],
    queryFn: () => getMembers(params),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

export const useSuggestionsQuery = (params: SuggestionsQueryParams) =>
  useQuery<SuggestionsResponse, Error>({
    queryKey: ["admin", "suggestions", params],
    queryFn: () => getSuggestions(params),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

export const useAdminFundraisingQuery = (params: FundraisingQueryParams) =>
  useQuery<AdminFundraisingResponse, Error>({
    queryKey: ["admin", "fundraising", params],
    queryFn: () => getFundraisingAdminData(params),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });
