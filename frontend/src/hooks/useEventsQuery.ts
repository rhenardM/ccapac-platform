"use client";

import { useQuery } from "@tanstack/react-query";
import type { Event, EventWithRegistrations } from "@/types/events";
import type { FilterState } from "./useEventFilters";
import {
  getEvents,
  getFeaturedEvents,
  getUpcomingEvents,
  getFilteredEvents,
  getEventsWithRegistrations,
} from "@/services/eventService";

export const useAllEventsQuery = () =>
  useQuery<Event[], Error>({
    queryKey: ["events", "all"],
    queryFn: () => getEvents(),
  });

export const useFeaturedEventsQuery = () =>
  useQuery<Event[], Error>({
    queryKey: ["events", "featured"],
    queryFn: () => getFeaturedEvents(),
  });

export const useUpcomingEventsQuery = (limit?: number) =>
  useQuery<Event[], Error>({
    queryKey: ["events", "upcoming", { limit }],
    queryFn: () => getUpcomingEvents(limit),
  });

export const useFilteredEventsQuery = (filters: FilterState) =>
  useQuery<Event[], Error>({
    queryKey: ["events", "list", filters],
    queryFn: () => getFilteredEvents(filters),
  });

export const useEventsWithRegistrationsQuery = () =>
  useQuery<EventWithRegistrations[], Error>({
    queryKey: ["admin", "events", "with-registrations"],
    queryFn: () => getEventsWithRegistrations(),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
  });
