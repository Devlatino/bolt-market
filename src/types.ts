export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

export interface ListingItem {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  url: string;
  source: string;
  location: string;
  date: string | number;
}

export interface SavedSearch {
  id: string;
  query: string;
  filters: {
    priceMin: string;
    priceMax: string;
    marketplace: string;
  };
  notificationsEnabled: boolean;
  notificationFrequency: 'instant' | 'daily' | 'weekly';
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  emailFrequency: 'instant' | 'daily' | 'weekly';
  browserNotifications: boolean;
}