import { prerender } from 'fractal-core/utils/aot'

import { runModule } from '../app/module'
import * as Root from '../app/Root/index'

const baseFolder = 'dist/public'

const paths = [
  {
    title: 'Fractal-featured',
    view: 'Home',
    outputFile: '/index.html',
    bundlePaths: ['./api.js', './vendor.js', './app.js'],
  },
]

const extrasFn = (view: string) => `<script>
  window.ssrView = '${view}'
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
    cb: async app => {
      await app.moduleAPI.toComp('Root', 'toRoute', path.view)
    },
  })
}
