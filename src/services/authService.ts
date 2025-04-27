import { User } from '../types';

// Mock user for demonstration
const mockUser: User = {
  id: 'user-123',
  email: 'demo@example.com',
  displayName: 'Demo User',
  createdAt: new Date().toISOString(),
};

// Simulate login API call
export const login = async (email: string, password: string): Promise<User> => {
  // In a real implementation, this would make an API call to authenticate
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...mockUser,
        email
      });
    }, 800);
  });
};

// Simulate register API call
export const register = async (email: string, password: string, name: string): Promise<User> => {
  // In a real implementation, this would make an API call to register
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...mockUser,
        email,
        displayName: name
      });
    }, 800);
  });
};

// Simulate logout API call
export const logout = async (): Promise<void> => {
  // In a real implementation, this would make an API call to logout
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
};

// Simulate update profile API call
export const updateProfile = async (data: Partial<User>): Promise<User> => {
  // In a real implementation, this would make an API call to update profile
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...mockUser,
        ...data
      });
    }, 800);
  });
};

// Simulate get current user API call
export const getCurrentUser = async (): Promise<User | null> => {
  // In a real implementation, this would check for an auth token and get the current user
  // For demo purposes, we'll randomly return a user or null
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate user not logged in (for demo purposes)
      resolve(null);
      
      // Uncomment to simulate logged in user
      // resolve(mockUser);
    }, 500);
  });
};