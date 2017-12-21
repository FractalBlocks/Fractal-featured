export type Langs = 'en' | 'es'

export const langs: Langs[] = ['en', 'es']

export interface Strings {
  fractalFeatured: string
  home: string
  blog: string
  about: string
}

export let lang: Langs = 'en'

export function setLang (l: Langs) {
  lang = l
}

export function getLang () {
  return lang
}

export const strings: { [LangName: string]: Strings } = {}

export async function getStrings (l: Langs): Promise<Strings> {
  if (!strings[l]) {
    strings[l] = (await import(typeof window !== 'undefined' ? `langs/${l}` : `./app/Root/i18n/langs/${l}`)).default
  }
  return strings[l]
}
