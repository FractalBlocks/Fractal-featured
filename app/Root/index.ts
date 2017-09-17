import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
  absoluteCenter,
  assoc,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'
import { getStrings, getLocale, locales } from '../i18n'

export const name = 'Root'

export const state = {
  locale: getLocale(),
}

export type S = typeof state

export const inputs: Inputs<S> = ({ toAct, stateOf }) => ({
  changeLocale: async () => {
    let s: S = stateOf()
    toAct('SetLocale', await getStrings(s.locale))
  },
})

export const actions: Actions<S> = {
  SetLocale: assoc('locale'),
}

const view: View<S> = ({ ctx, ev }) => async s => {
  let style = ctx.groups.style
  let $ = await getStrings(s.locale)

  return h('div', {
    key: ctx.name,
    class: { [style.base]: true },
  }, [
    h('div', {class: { [style.idiom]: true }}, [
      h('label', {class: { [style.idiomLabel]: true }}, $.idiom),
      h('select', {class: { [style.idiomSelect]: true }},
        locales.map(l => h('option', l))
      ),
    ]),
  ])
}

export const interfaces: Interfaces = { view }

const style: StyleGroup = {
  base: {
    width: '100%',
    height: '100%',
    overflow: 'auto',
    ...<any> absoluteCenter,
  },
  button: {
    width: '280px',
    height: '70px',
    margin: '20px',
    fontSize: '38px',
    borderRadius: '35px',
    color: 'white',
    backgroundColor: '#13A513',
    textAlign: 'center',
    transition: 'transform .4s, background .2s',
    cursor: 'pointer',
    userSelect: 'none',
    ...<any> absoluteCenter,
    '&:hover': {
      color: 'white',
      backgroundColor: 'purple',
      border: '3px solid purple',
      transform: 'perspective(1px) scale(1.1)',
    },
  },
  buttonActive: {
    color: 'purple',
    backgroundColor: '#FBFBFB',
    border: '3px solid #13A513',
  },
}

export const groups = { style }
