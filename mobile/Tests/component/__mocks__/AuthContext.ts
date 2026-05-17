export const useAuth = jest.fn().mockReturnValue({
  token: 'mock-token-12345',
  user: {
    id: 'user-1',
    email: 'test@goworldy.com',
    displayName: 'Test User',
    role: 'user',
  },
  isLoading: false,
  login: jest.fn(),
  loginWithGoogle: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  logoutOnUnauthorized: jest.fn(),
});

export const AuthProvider = ({ children }: any) => children;
