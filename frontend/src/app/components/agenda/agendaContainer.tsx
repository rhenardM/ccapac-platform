"use client";

import { useEventFilters } from "../../../hooks/useEventFilters";
//import EventFilters from "./eventFilters";
import Calendar from "./calendar";

export default function AgendaContainer() {
  const event = useEventFilters();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/5 to-background">
      
      {/*<EventFilters
        filters={event.filters}
        onFilterChange={event.updateFilter}
        onClearFilters={event.clearFilters}
        hasActiveFilters={event.hasActiveFilters}
        eventCount={event.filteredEvents.length}
      />*/}
        
      <Calendar events={event.filteredEvents} loading={event.loading} />
    </div>
  );
}
