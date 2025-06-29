// Placeholder AuthContext for type safety
import { createContext } from 'react';

export const useAuth = () => ({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});
