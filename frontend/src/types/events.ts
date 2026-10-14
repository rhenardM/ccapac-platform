export interface Event {
  id: number;
  title: string;
  slug: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime?: string;
  location: string;
  discipline: string;
  public: string;
  description: string;
  image: string;
  capacity?: string;
  featured?: boolean;
  category?: string;
  objective?: string;
  targetAudience?: string;
  impact?: string;
  slogan?: string;
  organizer?: string;
  contact?: string;
  requirements?: string;
  accessibility?: string;
  tags?: string[];
  isRegistrationOpen?: boolean;
  // Propriétés de compatibilité
  date: string; // Alias pour startDate
  time: string; // Alias pour startTime
}

export interface EventFilters {
  month?: string;
  discipline?: string;
  slug?: string;
  public?: string;
  featured?: boolean;
  upcoming?: boolean;
  limit?: number;
  [key: string]: string | boolean | number | undefined;
}

export interface EventRegistration {
  id: string;
  userName: string;
  userEmail: string;
  status: string;
  registeredAt: string;
}

export interface EventWithRegistrations extends Event {
  registrationsCount: number;
  registrations: EventRegistration[];
}
