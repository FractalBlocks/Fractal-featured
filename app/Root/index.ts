import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
  assoc,
  clickable,
  _,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { getStrings, getLang, langs, setLang } from '../i18n'

const tabs = [
  ['Home', 'home'],
  ['Blog', 'blog'],
  ['About', 'about'],
]

export const name = 'Root'

export const state = {
  lang: getLang(),
  tabName: 'Home',
}

export type S = typeof state

export const inputs: Inputs<S> = ({ ctx, toAct, stateOf, toIt, nest }) => ({
  toRoute: async tabName => {
    if (!ctx.components[ctx.id].components[tabName]) {
      await nest(tabName, await import(tabName))
    }
    await toAct('SetTab', tabName)
  },
  changeLang: async selectedIndex => {
    let lang = langs[selectedIndex]
    setLang(lang)
    await toAct('SetLang', lang)
  },
})

export const actions: Actions<S> = {
  SetLang: assoc('lang'),
  SetTab: assoc('tabName'),
}

const view: View<S> = ({ ctx, ev, vw }) => async s => {
  let style = ctx.groups.style
  let $ = await getStrings(s.lang)

  return h('div', {
    key: ctx.name,
    class: { [style.base]: true },
  }, [
    h('header', {class: { [style.header]: true }}, [
      h('div', {class: { [style.title]: true }}, $.fractalFeatured),
      h('div', {class: { [style.menu]: true }},
        tabs.map(
          t => h('div', {
            class: { [style.menuItem]: true },
            on: { click: ev('toRoute', t[0]) },
          }, $[t[1]])
        )
      ),
      h('div', {class: { [style.lang]: true }}, [
        h('select', {
          class: { [style.langSelect]: true },
          on: { change: ev('changeLang', _, ['target', 'selectedIndex']) },
        },
          langs.map(l => h('option', l))
        ),
      ]),
    ]),
    h('div', {class: { [style.container]: true }}, [
      vw(s.tabName),
    ]),
  ])
}

export const interfaces: Interfaces = { view }

const style: StyleGroup = {
  base: {
    width: '100%',
    height: '100%',
    fontFamily: '"Open sans", sans-serif',
    overflow: 'auto',
    color: '#4D4D4D',
  },
  header: {
    height: '60px',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  title: {
    padding: '5px 0 5px 20px',
    fontSize: '35px',
    color: '#57A0BC',
    ...clickable,
  },
  menu: {
    marginLeft: 'auto',
    display: 'flex',
  },
  menuItem: {
    marginRight: '15px',
    padding: '7px 10px',
    ...clickable,
    $nest: {
      '&:hover': {
        backgroundColor: '#DBD8D8',
      },
    },
  },
  lang: {
  },
  langLabel: {
    padding: '5px',
  },
  langSelect: {
    margin: '5px 15px 5px 5px',
    padding: '3px',
    fontSize: '16px',
    fontFamily: '"Open sans", sans-serif',
    color: '#4D4D4D',
    background: 'none',
  },
  container: {},
}

export const groups = { style }
