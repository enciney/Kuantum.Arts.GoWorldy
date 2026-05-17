export const api = {
  payment: {
    getPackages: jest.fn().mockResolvedValue({
      credits: [
        { id: 'credits_topic', name: 'Konu Kredisi', credits: 50, priceTL: 29 },
        { id: 'credits_100', name: '100 Kredi', credits: 100, priceTL: 49 },
      ],
      premium: [
        { id: 'premium_monthly', name: 'Aylık Premium', days: 30, priceTL: 250 },
      ],
    }),
    checkout: jest.fn().mockResolvedValue({ url: 'https://stripe.com/checkout/test' }),
  },
  users: {
    me: jest.fn().mockResolvedValue({ credits: 100, isPremium: false }),
  },
  auth: {
    login: jest.fn(),
    register: jest.fn(),
    google: jest.fn(),
  },
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'moderator' | 'user';
  userType?: 'emigrant' | 'consultant' | 'diaspora';
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export function setOn401Handler(_handler: () => void) {}
