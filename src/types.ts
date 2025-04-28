// src/types.ts
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
  source: string;    // ora può essere 'subito' | 'ebay' | 'leboncoin' | 'wallapop'
  location: string;
  date: string | number;
}

export interface SavedSearch {
  id: string;
  query: string;
  filters: {
    priceMin: string;
    priceMax: string;
    marketplace: 'all' | 'subito' | 'ebay' | 'leboncoin' | 'wallapop';
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

export interface Filters {
  priceMin?: number;
  priceMax?: number;
  marketplace?: 'all' | 'subito' | 'ebay' | 'leboncoin' | 'wallapop';
}

export interface SearchResults {
  items: ListingItem[];
  hasMore: boolean;
}
