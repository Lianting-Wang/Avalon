import type { TLanguage } from '@/i18n/interface';
export * from '@/i18n/interface';
export * from '@/i18n';

export const LanguageMap: { [key in TLanguage]: string } = {
  en: 'English',
  ru: 'Русский',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  es: 'Español',
  pt: 'Português',
};

export const DEFAULT_LANGUAGE: TLanguage = 'zh-CN';

export const supportedLanguages = Object.keys(LanguageMap) as TLanguage[];

export function languageFromPath(pathname: string): TLanguage | undefined {
  const firstSegment = pathname.split('/').filter(Boolean)[0]?.toLowerCase();

  if (!firstSegment) {
    return undefined;
  }

  return supportedLanguages.find((language) => language.toLowerCase() === firstSegment);
}

export function stripLanguagePrefix(pathname: string): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const language = languageFromPath(normalizedPath);

  if (!language) {
    return normalizedPath || '/';
  }

  const prefix = `/${language.toLowerCase()}`;
  const strippedPath = normalizedPath.slice(prefix.length);

  return strippedPath || '/';
}

export function buildLocalizedPath(pathname: string, language: TLanguage): string {
  const basePath = stripLanguagePrefix(pathname);

  if (language === DEFAULT_LANGUAGE) {
    return basePath;
  }

  const prefix = `/${language.toLowerCase()}`;

  return basePath === '/' ? `${prefix}/` : `${prefix}${basePath}`;
}

export function selectLocale(): TLanguage {
  return languageFromPath(document.location.pathname) || DEFAULT_LANGUAGE;
}
