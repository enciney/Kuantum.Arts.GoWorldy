import { api as defaultApi } from "../../services/api";

export interface GuideCountry {
  id: string;
  name: string;
  code: string;
}

export interface GuideStep {
  id: string;
  order: number;
  question: string;
  description?: string;
  blockingAnswer?: string;
  options?: string[];
  faqUrl?: string;
  stepType?: "checklist" | "assessment";
  isGlobal?: boolean;
}

export interface GuideProgress {
  id: string;
  stepId: string;
  answer: string;
  completedAt: string;
}

export interface CountriesAndProfile {
  countries: GuideCountry[];
  activeCountryId: string | null;
}

export interface StepsAndProgress {
  steps: GuideStep[];
  progress: GuideProgress[];
}

/** Ülke listesi + kullanıcının aktif ülkesini paralel yükler. XX (global) kodu filtreler. */
export async function loadCountriesAndProfile(
  token: string,
  apiForum: typeof defaultApi.forum = defaultApi.forum,
  apiUsers: typeof defaultApi.users = defaultApi.users
): Promise<CountriesAndProfile> {
  if (!token) return { countries: [], activeCountryId: null };
  const [countriesData, meData] = await Promise.all([
    apiForum.getCountries(token),
    apiUsers.me(token),
  ]);
  const countries = countriesData.filter((c) => c.code !== "XX");
  return { countries, activeCountryId: meData.activeGuideCountryId ?? null };
}

/** Adımlar + ilerlemeyi paralel yükler. */
export async function loadStepsAndProgress(
  countryId: string,
  token: string,
  apiGuide: typeof defaultApi.guide = defaultApi.guide
): Promise<StepsAndProgress> {
  if (!token || !countryId) return { steps: [], progress: [] };
  const [steps, progress] = await Promise.all([
    apiGuide.getSteps(countryId, token),
    apiGuide.getProgress(token),
  ]);
  return { steps, progress };
}

export async function saveAnswer(
  stepId: string,
  answer: string,
  countryId: string,
  token: string,
  apiGuide: typeof defaultApi.guide = defaultApi.guide
): Promise<{ id: string }> {
  if (!token) throw new Error("Token gerekli");
  if (!stepId) throw new Error("Adım ID gerekli");
  if (!countryId) throw new Error("Ülke gerekli");
  return apiGuide.saveProgress(stepId, answer, countryId, token);
}

export async function setActiveCountry(
  countryId: string,
  token: string,
  apiUsers: typeof defaultApi.users = defaultApi.users
): Promise<void> {
  if (!token) throw new Error("Token gerekli");
  if (!countryId) throw new Error("Ülke ID gerekli");
  await apiUsers.updateMe({ activeGuideCountryId: countryId }, token);
}

/** Blocking cevap kontrolü — saf fonksiyon, test edilebilir. */
export function isBlockingAnswer(blockingAnswer: string | undefined, answer: string): boolean {
  if (!blockingAnswer) return false;
  return answer.trim().toLowerCase() === blockingAnswer.trim().toLowerCase();
}

/** Kaç adım görünür olduğunu ve bloke durumunu hesaplar. */
export function computeVisibleUpTo(
  steps: GuideStep[],
  completedMap: Map<string, GuideProgress>,
  tab: "assessment" | "checklist"
): { visibleUpTo: number; blocked: boolean } {
  for (let i = 0; i < steps.length; i++) {
    const prog = completedMap.get(steps[i].id);
    if (!prog) return { visibleUpTo: i, blocked: false };
    if (tab === "checklist" && isBlockingAnswer(steps[i].blockingAnswer, prog.answer)) {
      return { visibleUpTo: i, blocked: true };
    }
  }
  return { visibleUpTo: steps.length - 1, blocked: false };
}
