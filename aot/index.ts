import { prerender } from 'fractal-core/utils/aot'

import { runModule } from '../src/module'
import * as Root from '../src/Root/index'

const baseFolder = 'dist/public'

const paths = [
  {
    title: 'Lariza',
    view: 'Main',
    outputFile: '/index.html',
    bundlePaths: ['./api.js', './vendor.js', './app.js'],
  },
  {
    title: 'Lariza Especialistas',
    view: 'Specialists',
    outputFile: '/specialists/index.html',
    bundlePaths: ['../api.js', '../vendor.js', '../app.js'],
  },
  {
    title: 'Lariza App',
    view: 'App',
    outputFile: '/app/index.html',
    bundlePaths: ['../api.js', '../vendor.js', '../app.js'],
  },
]

const extrasFn = (view: string) => `<script>
  window.ssrView = '${view}'
  window.ssrInitialized = true
</script>`

for (let i = 0, path; path = paths[i]; i++) {
  prerender({
    htmlFile: 'app/aot.html',
    cssFile: 'app/styles.css',
    outputFile: baseFolder + path.outputFile,
  }, {
    title: path.title,
    base: '/',
    root: Root,
    runModule,
    bundlePaths: path.bundlePaths,
    extras: extrasFn(path.view),
    cb: async app => await app.moduleAPI.toComp('Root', 'toRoute', path.view),
  })
}
