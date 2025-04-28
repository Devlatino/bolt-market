// src/services/userService.ts

import { SavedSearch, NotificationPreferences } from '../types';

// Mock data for saved searches
const mockSavedSearches: SavedSearch[] = [
  {
    id: '1',
    query: 'iPhone 13 Pro',
    filters: {
      priceMin: '600',
      priceMax: '900',
      marketplace: 'all'
    },
    notificationsEnabled: true,
    notificationFrequency: 'instant',
    createdAt: '2025-05-01T10:30:00.000Z',
    updatedAt: '2025-05-01T10:30:00.000Z'
  },
  {
    id: '2',
    query: 'MacBook Air M2',
    filters: {
      priceMin: '800',
      priceMax: '1200',
      marketplace: 'all'
    },
    notificationsEnabled: true,
    notificationFrequency: 'daily',
    createdAt: '2025-04-25T15:45:00.000Z',
    updatedAt: '2025-04-25T15:45:00.000Z'
  },
  {
    id: '3',
    query: 'Fotocamera mirrorless Sony',
    filters: {
      priceMin: '',
      priceMax: '',
      marketplace: 'all'
    },
    notificationsEnabled: false,
    notificationFrequency: 'instant',
    createdAt: '2025-04-20T09:15:00.000Z',
    updatedAt: '2025-04-20T09:15:00.000Z'
  }
];

// Mock notification preferences
const mockNotificationPreferences: NotificationPreferences = {
  email: true,
  push: false,
  emailFrequency: 'instant',
  browserNotifications: true
};

// Simulate save search API call
export const saveSearch = async (
  query: string,
  filters: { priceMin: string; priceMax: string; marketplace: string }
): Promise<SavedSearch> => {
  // In a real implementation, this would make an API call to save the search
  return new Promise((resolve) => {
    setTimeout(() => {
      const newSearch: SavedSearch = {
        id: `search-${Date.now()}`,
        query,
        filters,
        notificationsEnabled: true,
        notificationFrequency: 'instant',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      resolve(newSearch);
    }, 800);
  });
};

// Simulate get user saved searches API call
export const getUserSavedSearches = async (): Promise<SavedSearch[]> => {
  // In a real implementation, this would make an API call to get the user's saved searches
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockSavedSearches);
    }, 800);
  });
};

// Simulate delete saved search API call
export const deleteSavedSearch = async (id: string): Promise<void> => {
  // Log to ensure `id` is “used” and suppresses lint error
  console.log(`Deleting saved search ${id}`);
  // In a real implementation, this would make an API call to delete the saved search
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
};

// Simulate update saved search API call
export const updateSavedSearch = async (search: SavedSearch): Promise<SavedSearch> => {
  // In a real implementation, this would make an API call to update the saved search
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...search,
        updatedAt: new Date().toISOString()
      });
    }, 800);
  });
};

// Simulate get user notification preferences API call
export const getUserNotificationPreferences = async (): Promise<NotificationPreferences> => {
  // In a real implementation, this would make an API call to get the user's notification preferences
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockNotificationPreferences);
    }, 800);
  });
};

// Simulate update notification preferences API call
export const updateNotificationPreferences = async (
  preferences: NotificationPreferences
): Promise<NotificationPreferences> => {
  // In a real implementation, this would make an API call to update the notification preferences
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(preferences);
    }, 800);
  });
};
