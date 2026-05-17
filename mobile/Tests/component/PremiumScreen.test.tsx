/**
 * PremiumScreen Component Tests
 *
 * Tests the PremiumScreen component behaviour:
 *  1. getPackages() is called on mount
 *  2. Package names are rendered
 *  3. Pressing premium button calls checkout() with correct priceId
 *  4. API error shows error message
 *  5. Loading state is shown while packages load
 *
 * Mock wiring:
 *  - api             → Tests/component/__mocks__/api.ts      (via moduleNameMapper ../../services/api)
 *  - @react-navigation/native → Tests/component/__mocks__/@react-navigation/native.ts
 *  - AuthContext     → inline jest.mock
 *  - native modules  → inline jest.mock
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Mock native modules before importing the screen ─────────────────────────

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  FontAwesome5: 'FontAwesome5',
}));

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  openURL: jest.fn().mockResolvedValue(undefined),
}));

// ── Mock AuthContext ─────────────────────────────────────────────────────────

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: jest.fn().mockReturnValue({
    token: 'mock-token-12345',
    user: {
      id: 'user-1',
      email: 'test@goworldy.com',
      displayName: 'Test User',
      role: 'user',
    },
    isLoading: false,
  }),
  AuthProvider: ({ children }: any) => children,
}));

// ── api mock is wired via moduleNameMapper ("../../services/api") ────────────
// The PremiumScreen imports from "../../services/api" (relative to src/screens/main/).
// moduleNameMapper maps that pattern to __mocks__/api.ts.
// In this test file we import via the same logical path so the mock is returned.
import { api } from '../../src/services/api';
import { PremiumScreen } from '../../src/screens/main/PremiumScreen';

const mockGetPackages = api.payment.getPackages as jest.Mock;
const mockCheckout = api.payment.checkout as jest.Mock;
const mockUsersMe = api.users.me as jest.Mock;

// ── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_PACKAGES = {
  credits: [
    { id: 'credits_topic', name: 'Konu Kredisi', credits: 50, priceTL: 29 },
    { id: 'credits_100', name: '100 Kredi', credits: 100, priceTL: 49 },
  ],
  premium: [
    { id: 'premium_monthly', name: 'Aylık Premium', days: 30, priceTL: 250 },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPackages.mockResolvedValue(DEFAULT_PACKAGES);
  mockUsersMe.mockResolvedValue({ credits: 100, isPremium: false });
  mockCheckout.mockResolvedValue({ url: 'https://stripe.com/checkout/test' });
});

// ── Test 1: getPackages() is called on mount ─────────────────────────────────

test('1 — ekran yüklenince getPackages() çağrılır', async () => {
  await act(async () => {
    render(<PremiumScreen />);
  });
  expect(mockGetPackages).toHaveBeenCalledTimes(1);
});

// ── Test 2: Package names are rendered ───────────────────────────────────────

test('2 — paket isimleri ekranda görünür', async () => {
  await act(async () => {
    render(<PremiumScreen />);
  });

  await waitFor(() => {
    expect(screen.getByText('Aylık Premium')).toBeTruthy();
    expect(screen.getByText('Konu Kredisi')).toBeTruthy();
  });
});

// ── Test 3: Premium button calls checkout with correct priceId ───────────────

test('3 — premium kartına basılınca checkout() doğru priceId ile çağrılır', async () => {
  const alertSpy = jest
    .spyOn(Alert, 'alert')
    .mockImplementation((_title: string, _msg: string, buttons?: any[]) => {
      const devam = buttons?.find((b) => b.text === 'Devam');
      devam?.onPress?.();
    });

  await act(async () => {
    render(<PremiumScreen />);
  });

  // Wait for packages to load
  await waitFor(() => {
    expect(screen.getByText('Şimdi Premium Ol')).toBeTruthy();
  });

  await act(async () => {
    fireEvent.press(screen.getByText('Şimdi Premium Ol'));
  });

  await waitFor(() => {
    expect(mockCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ priceId: 'premium_monthly', productType: 'premium_monthly' }),
      'mock-token-12345'
    );
  });

  alertSpy.mockRestore();
});

// ── Test 4: API error shows error message ────────────────────────────────────

test('4 — API hata verirse hata mesajı görünür', async () => {
  mockGetPackages.mockRejectedValue(new Error('Network Error'));

  await act(async () => {
    render(<PremiumScreen />);
  });

  await waitFor(() => {
    expect(
      screen.getByText('Paket bilgileri yüklenemedi. Lütfen tekrar deneyin.')
    ).toBeTruthy();
  });
});

// ── Test 5: Loading state while packages load ─────────────────────────────────

test('5 — paketler yüklenirken loading (ActivityIndicator) gösterilir', async () => {
  let resolve!: (v: any) => void;
  mockGetPackages.mockReturnValue(new Promise((r) => { resolve = r; }));

  render(<PremiumScreen />);

  // While the promise is still pending, a progress indicator should be visible
  expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);

  // Complete loading
  await act(async () => {
    resolve(DEFAULT_PACKAGES);
  });
});
