import {
  Actions,
  Inputs,
  Interfaces,
  StyleGroup,
} from 'fractal-core'
import { View, h } from 'fractal-core/interfaces/view'

export const name = 'Blog'

export const state = {}

export type S = typeof state

export const inputs: Inputs = ctx => ({
})

export const actions: Actions<S> = {
}

const view: View<S> = ({ ctx }) => async s => {
  let style = ctx.groups.style

  return h('div', {
    key: ctx.name,
    class: { [style.base]: true },
  }, [
    <any> 'Blog',
  ])
}

export const interfaces: Interfaces = { view }

const style: StyleGroup = {
  base: {
    width: '100%',
    height: '100%',
    overflow: 'auto',
  },
}

export const groups = { style }
