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

let fuse, app, vendor
let isProduction = false

const setupServer = server => {
  const app = server.httpServer.app
  app.use('/assets/', express.static(path.join(__dirname, 'assets')))
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
  app = fuse
    .bundle('app')
    .split('i18n/locales/en.js', 'i18n/locales/en > i18n/locales/en.ts')
    .split('i18n/locales/es.js', 'i18n/locales/es > i18n/locales/es.ts')
    .instructions('> [index.ts] + [i18n/**/**.ts]')
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
