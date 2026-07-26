import {
  getDocument,
  saveDocument,
  SITE_DOCUMENT_KEY,
} from "@/lib/documentStore";

export interface ContactInfo {
  organization: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
  note: string;
  /** Googleフォームの埋め込みURL（…/viewform?embedded=true） */
  googleFormEmbedUrl: string;
}

export interface SiteConfig {
  contact: ContactInfo;
}

const defaultContact: ContactInfo = {
  organization: "パラスポーツフェスはりま",
  email: "bochahimeji@gmail.com",
  phone: "090-7098-8649（担当：村上）",
  address: "兵庫県姫路市",
  hours: "",
  note: "大会への参加申込・お問い合わせは、下記までご連絡ください。",
  googleFormEmbedUrl: "",
};

function normalizeSite(data: SiteConfig | null): SiteConfig {
  return {
    contact: { ...defaultContact, ...(data?.contact ?? {}) },
  };
}

export async function getSiteConfig(): Promise<SiteConfig> {
  const doc = await getDocument<SiteConfig>(SITE_DOCUMENT_KEY);
  return normalizeSite(doc?.payload ?? null);
}

export async function saveSiteConfig(
  config: SiteConfig,
  expectedVersion?: number
): Promise<{ documentVersion: number }> {
  const normalized = normalizeSite(config);
  const saved = await saveDocument(SITE_DOCUMENT_KEY, normalized, expectedVersion);
  return { documentVersion: saved.version };
}

/** 環境変数があれば Google フォーム URL を上書き */
export function getGoogleFormEmbedUrl(contact: ContactInfo): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_FORM_EMBED_URL?.trim();
  if (fromEnv) return fromEnv;
  const fromFile = contact.googleFormEmbedUrl?.trim();
  return fromFile || null;
}

export function getContactEmail(contact: ContactInfo): string {
  const fromEnv = process.env.CONTACT_EMAIL?.trim();
  return fromEnv || contact.email;
}
