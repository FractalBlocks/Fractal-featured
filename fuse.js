const {
  FuseBox,
  SassPlugin,
  CSSPlugin,
  SVGPlugin,
  JSONPlugin,
  WebIndexPlugin,
  Sparky,
  UglifyESPlugin,
  QuantumPlugin,
  EnvPlugin
} = require('fuse-box')

const express = require('express')
const path = require('path')
const fs = require('fs-jetpack')

let fuse, app, vendor
let isProduction = false

const setupServer = server => {
  const app = server.httpServer.app
  app.use('/assets/', express.static(path.join(__dirname, 'assets')))
}

const splitLangs = bundle => {
  let langFiles = fs.find('app/i18n/langs/', {
    matching: '*.ts',
  })
  let langs = langFiles.map(f => {
    let parts = f.split('/')
    return parts[parts.length - 1].split('.')[0]
  })
  langs.forEach(l => {
    bundle = bundle.split(`i18n/langs/${l}.js`, `langs/${l} > i18n/langs/${l}.ts`)
  })
  return bundle
}

Sparky.task('config', () => {
  fuse = FuseBox.init({
    homeDir: 'app/',
    output: 'dist/public/$name.js',
    hash: isProduction,
    tsConfig : 'tsconfig.json',
    experimentalFeatures: true,
    useTypescriptCompiler: true,
    sourceMaps: !isProduction ? { project: true, vendor: true } : false,
    cache: !isProduction,
    plugins: [
      SVGPlugin(),
      CSSPlugin(),
      JSONPlugin(),
      EnvPlugin({ isProduction }),
      WebIndexPlugin({
        path: '.',
        template: 'app/index.html',
      }),
      isProduction && QuantumPlugin({
        treeshake: true,
        // uglify: true,
      }),
    ],
  })

  // vendor
  vendor = fuse.bundle('vendor').instructions('~ index.ts')

  // bundle app
  app = splitLangs(fuse.bundle('app'))
    .split(`Root/Home.js`, `Home > Root/Home.ts`)
    .split(`Root/About.js`, `About > Root/About.ts`)
    .split(`Root/Blog/**`, `Blog > Root/Blog/index.ts`)
    .instructions('> [index.ts] + [**/**.ts]')
})

// main task
Sparky.task('default', ['clean', 'config'], () => {
  fuse.dev({ port: 3000 }, setupServer)
  vendor.watch().hmr()
  app.watch().hmr()
  return fuse.run()
})

// wipe it all
Sparky.task('clean', () => Sparky.src('dist/public/*').clean('dist/public/'))
// wipe it all from .fusebox - cache dir
Sparky.task('clean-cache', () => Sparky.src('.fusebox/*').clean('.fusebox/'))

// prod build
Sparky.task('set-production-env', () => isProduction = true)
Sparky.task('dist', ['clean', 'clean-cache', 'set-production-env', 'config'], () => {
  fuse.dev({ port: 3000 }, setupServer)
  return fuse.run()
})
