import en from './locale/en'

export type Locales = 'en' | 'es'

export const locales = ['en', 'es']

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

export const strings: { [localeName: string]: Strings } = {
  en,
}

export async function getStrings (l: Locales): Promise<Strings> {
  if (!strings[l]) {
    strings[l] = await import(`locale/${l}`)
  }
  return strings[l]
}
