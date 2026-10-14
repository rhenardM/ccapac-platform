import api from "@/lib/api";

export type MemberNotification = {
  id: number;
  requestId: number;
  historyId: number | null;
  type: "STATUS_CHANGED" | string;
  title: string;
  message: string;
  previousStatus: string | null;
  newStatus: string | null;
  isRead: boolean;
  createdAt: string;
  reference?: string | null;
  eventName?: string | null;
};

export type NotificationsResponse = {
  success: boolean;
  unreadCount: number;
  data: MemberNotification[];
};

export type ArtisticNotificationSource =
  | "RESERVATION"
  | "PROJECT_PROPOSAL";

export type ArtisticNotification = {
  id: number;
  sourceType: ArtisticNotificationSource;
  sourceId: number;
  documentId: number | null;
  type:
    | "RESERVATION_DOCUMENT"
    | "PROJECT_PROPOSAL_RECEIVED"
    | "PROJECT_DOCUMENT"
    | string;
  title: string;
  message: string;
  actionUrl: string;
  isRead: boolean;
  createdAt: string;
};

export type ArtisticUnreadCount = {
  total: number;
  reservations: number;
  projects: number;
};

export type ArtisticNotificationsResponse = {
  success: boolean;
  unreadCount: ArtisticUnreadCount;
  data: ArtisticNotification[];
};

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("notifications-updated")
    );
  }
}

export const notificationService = {
  async getMyNotifications(): Promise<NotificationsResponse> {
    const response = await api.get<NotificationsResponse>(
      "/space-requests/notifications"
    );

    return {
      success: Boolean(response.data?.success),
      unreadCount: Number(
        response.data?.unreadCount || 0
      ),
      data: Array.isArray(response.data?.data)
        ? response.data.data
        : [],
    };
  },

  async markAsRead(
    notificationId: number
  ): Promise<void> {
    await api.patch(
      `/space-requests/notifications/${notificationId}/read`
    );

    notifyUpdated();
  },

  async markAllAsRead(): Promise<void> {
    await api.patch(
      "/space-requests/notifications/read-all"
    );

    notifyUpdated();
  },

  async getArtisticNotifications(
    source: "ALL" | ArtisticNotificationSource = "ALL"
  ): Promise<ArtisticNotificationsResponse> {
    const response =
      await api.get<ArtisticNotificationsResponse>(
        "/space-requests/artistic-notifications",
        {
          params: { source },
        }
      );

    const unreadCount =
      response.data?.unreadCount;

    return {
      success: Boolean(response.data?.success),
      unreadCount: {
        total: Number(unreadCount?.total || 0),
        reservations: Number(
          unreadCount?.reservations || 0
        ),
        projects: Number(
          unreadCount?.projects || 0
        ),
      },
      data: Array.isArray(response.data?.data)
        ? response.data.data
        : [],
    };
  },

  async markArtisticAsRead(
    notificationId: number
  ): Promise<void> {
    await api.patch(
      `/space-requests/artistic-notifications/${notificationId}/read`
    );

    notifyUpdated();
  },

  async markAllArtisticAsRead(
    source: "ALL" | ArtisticNotificationSource = "ALL"
  ): Promise<void> {
    await api.patch(
      "/space-requests/artistic-notifications/read-all",
      { source }
    );

    notifyUpdated();
  },
};
