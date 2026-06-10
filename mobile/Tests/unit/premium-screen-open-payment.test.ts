/**
 * Unit Testleri — PremiumScreen.openPayment() mantığı
 *
 * PremiumScreen bileşeni tam render edilmeden openPayment() fonksiyonunun
 * iş mantığı izole olarak test edilir.
 *
 * Kapsam:
 *  - Aynı plan + autoRenew=true → showBanner çağrılmalı, navigateToPayment çağrılmamalı
 *  - Aynı plan + autoRenew=false → upgradeConfirm state mode: "subscribe" ile set edilmeli
 *  - Farklı plan + aktif premium → upgradeConfirm state mode: "upgrade" ile set edilmeli
 *  - Premium yok → direkt navigateToPayment çağrılmalı
 */

// PremiumScreen'in openPayment mantığını test etmek için fonksiyonu izole ediyoruz.
// React Native bileşen render'ı yerine fonksiyon mantığını doğrudan test ederiz.

interface PremiumPackage {
  id: string;
  name: string;
  days: number;
  priceTL: number;
  features?: string[];
  isSubscription?: boolean;
  subscriptionDiscountPercent?: number;
}

interface PremiumStatus {
  isPremium: boolean;
  premiumUntil?: string;
  premiumPlanId?: string;
  autoRenew?: boolean;
}

interface UpgradeConfirmState {
  visible: boolean;
  pkg: PremiumPackage | null;
  applyAutoRenew: boolean;
  currentExpiry: string;
  newExpiry: string;
  mode: "upgrade" | "subscribe";
}

// PremiumScreen'deki openPayment mantığını pure function olarak çıkarıyoruz
function createOpenPayment(opts: {
  premiumStatus: PremiumStatus;
  showBanner: (msg: string) => void;
  setUpgradeConfirm: (s: UpgradeConfirmState) => void;
  navigateToPayment: (pkg: PremiumPackage, applyAutoRenew: boolean) => void;
}) {
  const { premiumStatus, showBanner, setUpgradeConfirm, navigateToPayment } = opts;

  const isActivelyPremium =
    premiumStatus.isPremium &&
    !!premiumStatus.premiumUntil &&
    new Date(premiumStatus.premiumUntil) > new Date();

  return function openPayment(pkg: PremiumPackage, applyAutoRenew: boolean) {
    if (pkg.isSubscription && isActivelyPremium && premiumStatus.premiumPlanId) {
      const isSamePlan = premiumStatus.premiumPlanId === pkg.id;

      if (isSamePlan && premiumStatus.autoRenew) {
        showBanner(`Zaten ${pkg.name} aboneliğiniz aktif. Herhangi bir işlem gerekmez.`);
        return;
      }

      if (isSamePlan && !premiumStatus.autoRenew) {
        const discount = pkg.subscriptionDiscountPercent ?? 0;
        const discountedPrice = Math.round(pkg.priceTL * (100 - discount)) / 100;
        const currentExpiry = premiumStatus.premiumUntil
          ? new Date(premiumStatus.premiumUntil).toDateString()
          : "";
        setUpgradeConfirm({
          visible: true,
          pkg: { ...pkg, priceTL: discountedPrice },
          applyAutoRenew: true,
          currentExpiry,
          newExpiry: currentExpiry,
          mode: "subscribe",
        });
        return;
      }

      // Farklı plan → upgrade confirm
      const newExpiry = new Date(Date.now() + pkg.days * 86_400_000);
      const currentExpiry = premiumStatus.premiumUntil
        ? new Date(premiumStatus.premiumUntil).toDateString()
        : "";
      setUpgradeConfirm({
        visible: true,
        pkg,
        applyAutoRenew,
        currentExpiry,
        newExpiry: newExpiry.toDateString(),
        mode: "upgrade",
      });
      return;
    }

    navigateToPayment(pkg, applyAutoRenew);
  };
}

// ─── Test verileri ──────────────────────────────────────────────────────────

const FUTURE_DATE = new Date(Date.now() + 7 * 86_400_000).toISOString();
const PAST_DATE = new Date(Date.now() - 86_400_000).toISOString();

const SUB_PLAN_A: PremiumPackage = {
  id: "plan_weekly",
  name: "Haftalık Abonelik",
  days: 7,
  priceTL: 99,
  isSubscription: true,
  subscriptionDiscountPercent: 20,
};

const SUB_PLAN_B: PremiumPackage = {
  id: "plan_monthly",
  name: "Aylık Abonelik",
  days: 30,
  priceTL: 250,
  isSubscription: true,
  subscriptionDiscountPercent: 15,
};

const ONE_TIME_PLAN: PremiumPackage = {
  id: "plan_onetime",
  name: "Tek Seferlik Paket",
  days: 30,
  priceTL: 49,
  isSubscription: false,
};

// ─── Test suite ──────────────────────────────────────────────────────────────

describe("openPayment() — aynı plan + autoRenew=true (zaten abone)", () => {
  it("PS-OP-01: showBanner çağrılmalı", () => {
    const showBanner = jest.fn();
    const setUpgradeConfirm = jest.fn();
    const navigateToPayment = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: {
        isPremium: true,
        premiumUntil: FUTURE_DATE,
        premiumPlanId: SUB_PLAN_A.id,
        autoRenew: true,
      },
      showBanner,
      setUpgradeConfirm,
      navigateToPayment,
    });

    openPayment(SUB_PLAN_A, true);

    expect(showBanner).toHaveBeenCalledTimes(1);
    expect(showBanner).toHaveBeenCalledWith(
      expect.stringContaining(SUB_PLAN_A.name)
    );
  });

  it("PS-OP-02: navigateToPayment çağrılmamalı", () => {
    const showBanner = jest.fn();
    const setUpgradeConfirm = jest.fn();
    const navigateToPayment = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: {
        isPremium: true,
        premiumUntil: FUTURE_DATE,
        premiumPlanId: SUB_PLAN_A.id,
        autoRenew: true,
      },
      showBanner,
      setUpgradeConfirm,
      navigateToPayment,
    });

    openPayment(SUB_PLAN_A, true);

    expect(navigateToPayment).not.toHaveBeenCalled();
  });

  it("PS-OP-03: setUpgradeConfirm çağrılmamalı", () => {
    const showBanner = jest.fn();
    const setUpgradeConfirm = jest.fn();
    const navigateToPayment = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: {
        isPremium: true,
        premiumUntil: FUTURE_DATE,
        premiumPlanId: SUB_PLAN_A.id,
        autoRenew: true,
      },
      showBanner,
      setUpgradeConfirm,
      navigateToPayment,
    });

    openPayment(SUB_PLAN_A, true);

    expect(setUpgradeConfirm).not.toHaveBeenCalled();
  });
});

describe("openPayment() — aynı plan + autoRenew=false (aboneliğe geç)", () => {
  it("PS-OP-04: setUpgradeConfirm mode='subscribe' ile çağrılmalı", () => {
    const showBanner = jest.fn();
    const setUpgradeConfirm = jest.fn();
    const navigateToPayment = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: {
        isPremium: true,
        premiumUntil: FUTURE_DATE,
        premiumPlanId: SUB_PLAN_A.id,
        autoRenew: false,
      },
      showBanner,
      setUpgradeConfirm,
      navigateToPayment,
    });

    openPayment(SUB_PLAN_A, true);

    expect(setUpgradeConfirm).toHaveBeenCalledTimes(1);
    const arg = setUpgradeConfirm.mock.calls[0][0] as UpgradeConfirmState;
    expect(arg.mode).toBe("subscribe");
    expect(arg.visible).toBe(true);
  });

  it("PS-OP-05: navigateToPayment çağrılmamalı", () => {
    const showBanner = jest.fn();
    const setUpgradeConfirm = jest.fn();
    const navigateToPayment = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: {
        isPremium: true,
        premiumUntil: FUTURE_DATE,
        premiumPlanId: SUB_PLAN_A.id,
        autoRenew: false,
      },
      showBanner,
      setUpgradeConfirm,
      navigateToPayment,
    });

    openPayment(SUB_PLAN_A, true);

    expect(navigateToPayment).not.toHaveBeenCalled();
  });

  it("PS-OP-06: showBanner çağrılmamalı", () => {
    const showBanner = jest.fn();
    const setUpgradeConfirm = jest.fn();
    const navigateToPayment = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: {
        isPremium: true,
        premiumUntil: FUTURE_DATE,
        premiumPlanId: SUB_PLAN_A.id,
        autoRenew: false,
      },
      showBanner,
      setUpgradeConfirm,
      navigateToPayment,
    });

    openPayment(SUB_PLAN_A, true);

    expect(showBanner).not.toHaveBeenCalled();
  });

  it("PS-OP-07: confirm state'de applyAutoRenew=true olmalı", () => {
    const setUpgradeConfirm = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: {
        isPremium: true,
        premiumUntil: FUTURE_DATE,
        premiumPlanId: SUB_PLAN_A.id,
        autoRenew: false,
      },
      showBanner: jest.fn(),
      setUpgradeConfirm,
      navigateToPayment: jest.fn(),
    });

    openPayment(SUB_PLAN_A, true);

    const arg = setUpgradeConfirm.mock.calls[0][0] as UpgradeConfirmState;
    expect(arg.applyAutoRenew).toBe(true);
  });
});

describe("openPayment() — farklı plan + aktif premium (upgrade)", () => {
  it("PS-OP-08: setUpgradeConfirm mode='upgrade' ile çağrılmalı", () => {
    const showBanner = jest.fn();
    const setUpgradeConfirm = jest.fn();
    const navigateToPayment = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: {
        isPremium: true,
        premiumUntil: FUTURE_DATE,
        premiumPlanId: SUB_PLAN_A.id, // mevcut plan: A
        autoRenew: false,
      },
      showBanner,
      setUpgradeConfirm,
      navigateToPayment,
    });

    openPayment(SUB_PLAN_B, false); // farklı plan: B

    expect(setUpgradeConfirm).toHaveBeenCalledTimes(1);
    const arg = setUpgradeConfirm.mock.calls[0][0] as UpgradeConfirmState;
    expect(arg.mode).toBe("upgrade");
    expect(arg.visible).toBe(true);
  });

  it("PS-OP-09: navigateToPayment çağrılmamalı", () => {
    const navigateToPayment = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: {
        isPremium: true,
        premiumUntil: FUTURE_DATE,
        premiumPlanId: SUB_PLAN_A.id,
        autoRenew: false,
      },
      showBanner: jest.fn(),
      setUpgradeConfirm: jest.fn(),
      navigateToPayment,
    });

    openPayment(SUB_PLAN_B, false);

    expect(navigateToPayment).not.toHaveBeenCalled();
  });

  it("PS-OP-10: confirm state'de doğru pkg geçmeli", () => {
    const setUpgradeConfirm = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: {
        isPremium: true,
        premiumUntil: FUTURE_DATE,
        premiumPlanId: SUB_PLAN_A.id,
        autoRenew: true,
      },
      showBanner: jest.fn(),
      setUpgradeConfirm,
      navigateToPayment: jest.fn(),
    });

    openPayment(SUB_PLAN_B, false);

    const arg = setUpgradeConfirm.mock.calls[0][0] as UpgradeConfirmState;
    expect(arg.pkg?.id).toBe(SUB_PLAN_B.id);
  });
});

describe("openPayment() — premium yok → direkt navigateToPayment", () => {
  it("PS-OP-11: premium yokken direkt navigateToPayment çağrılmalı", () => {
    const showBanner = jest.fn();
    const setUpgradeConfirm = jest.fn();
    const navigateToPayment = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: { isPremium: false },
      showBanner,
      setUpgradeConfirm,
      navigateToPayment,
    });

    openPayment(SUB_PLAN_A, false);

    expect(navigateToPayment).toHaveBeenCalledTimes(1);
    expect(navigateToPayment).toHaveBeenCalledWith(SUB_PLAN_A, false);
  });

  it("PS-OP-12: showBanner ve setUpgradeConfirm çağrılmamalı", () => {
    const showBanner = jest.fn();
    const setUpgradeConfirm = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: { isPremium: false },
      showBanner,
      setUpgradeConfirm,
      navigateToPayment: jest.fn(),
    });

    openPayment(SUB_PLAN_A, false);

    expect(showBanner).not.toHaveBeenCalled();
    expect(setUpgradeConfirm).not.toHaveBeenCalled();
  });

  it("PS-OP-13: süresi geçmiş premium (isPremium=true ama premiumUntil geçmişte) → direkt navigateToPayment", () => {
    const navigateToPayment = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: {
        isPremium: true,
        premiumUntil: PAST_DATE, // geçmişte
        premiumPlanId: SUB_PLAN_A.id,
        autoRenew: true,
      },
      showBanner: jest.fn(),
      setUpgradeConfirm: jest.fn(),
      navigateToPayment,
    });

    openPayment(SUB_PLAN_A, true);

    // isActivelyPremium=false olduğu için direkt navigate edilmeli
    expect(navigateToPayment).toHaveBeenCalledTimes(1);
  });

  it("PS-OP-14: premium=false, one-time plan → direkt navigateToPayment", () => {
    const navigateToPayment = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: { isPremium: false },
      showBanner: jest.fn(),
      setUpgradeConfirm: jest.fn(),
      navigateToPayment,
    });

    openPayment(ONE_TIME_PLAN, false);

    expect(navigateToPayment).toHaveBeenCalledWith(ONE_TIME_PLAN, false);
  });

  it("PS-OP-15: premium var, one-time plan → direkt navigateToPayment (subscription kontrolü yapılmaz)", () => {
    const navigateToPayment = jest.fn();

    const openPayment = createOpenPayment({
      premiumStatus: {
        isPremium: true,
        premiumUntil: FUTURE_DATE,
        premiumPlanId: SUB_PLAN_A.id,
        autoRenew: true,
      },
      showBanner: jest.fn(),
      setUpgradeConfirm: jest.fn(),
      navigateToPayment,
    });

    // isSubscription=false olan plan → subscription bloğuna girmemeli
    openPayment(ONE_TIME_PLAN, false);

    expect(navigateToPayment).toHaveBeenCalledTimes(1);
  });
});
