export type Locales = 'en' | 'es'

export const locales: Locales[] = ['en', 'es']

export interface Strings {
  idiom: string
}

export let locale: Locales = 'en'

export function setLocale (l: Locales) {
  locale = l
}

export function getLocale () {
  return locale
}

export const strings: { [localeName: string]: Strings } = {}

export async function getStrings (l: Locales): Promise<Strings> {
  if (!strings[l]) {
    strings[l] = (await import(`i18n/locales/${l}`)).default
  }
  return strings[l]
}
