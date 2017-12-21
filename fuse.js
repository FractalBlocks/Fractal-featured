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
const TypeHelper = require('fuse-box-typechecker').TypeHelper

const splitBundles = [
  ['Root/Home.js', 'Home', 'Root/Home.ts'],
  ['Root/About.js', 'About', 'Root/About.ts'],
  ['Root/Blog/**', 'Blog', 'Root/Blog/index.ts'],
]

let fuse, fuseSW, fuseServer, app, vendor, SW, server
let isProduction = false

const setupServer = server => {
  const app = server.httpServer.app
  app.use('/assets/', express.static(path.join(__dirname, 'assets')))
}

let langFiles = fs.find('app/Root/i18n/langs/', {
  matching: '*.ts',
})

let langs = langFiles.map(f => {
  let parts = f.split('/')
  return parts[parts.length - 1].split('.')[0]
})

// bundleFiles = bundleFiles.concat(langs.map(l => `langs/${l}.js`))

const splitAppBundles = (bundle) => {
  splitBundles.forEach(([path, name, file]) => {
    bundle = bundle.split(path, `${name} > ${file}`)
  })
  return bundle
}

const splitLangs = bundle => {
  langs.forEach(l => {
    bundle = bundle.split(`Root/i18n/langs/${l}.js`, `langs/${l} > Root/i18n/langs/${l}.ts`)
  })
  return bundle
}

Sparky.task('config', () => {
  fuse = FuseBox.init({
    homeDir: 'app/',
    output: 'dist/public/$name.js',
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
        target: 'browser',
        treeshake: true,
        replaceTypeOf: false,
        // uglify: true,
      }),
    ],
  })

  let bundleFiles = [
    '/',
    'vendor.js',
    'app.js',
    ...isProduction ? [
      'api.js',
      ...splitBundles.map(b => `${b[1]}.js`),
    ] : [],
    'https://fonts.googleapis.com/css?family=Open+Sans',
    'https://fonts.gstatic.com/s/opensans/v14/cJZKeOuBrn4kERxqtaUH3VtXRa8TVwTICgirnJhmVJw.woff2',
  ]

  // write bundles.json
  const bundleListJSON = bundleFiles.reduce(
    (a, name, idx) => a + `"${name}"${idx !== bundleFiles.length - 1 ? ',' : ''}`
  , '')
  fs.write('app/bundles.json', `[${bundleListJSON}]`)

  // vendor
  vendor = fuse.bundle('vendor').instructions('~ index.ts')

  // bundle app
  app = splitAppBundles(splitLangs(fuse.bundle('app')))
    .instructions('> [index.ts] + [**/**.ts]')
})

// main task
Sparky.task('default', ['clean', 'config', 'copy-files', 'service-worker-bundle', 'server-bundle', 'run-server'], () => {
  fuse.dev({ port: 3001 }, setupServer)
  let typeHelper = TypeHelper({
    tsConfig: './tsconfig.json',
    basePath:'.',
    name: 'App typechecker',
  })
  app.watch().hmr().completed(proc => {
    console.log(`\x1b[36m%s\x1b[0m`, `client bundled`)
    typeHelper.runSync()
  })
  SW.watch()
  server.watch()

  fuseServer.run()
  fuseSW.run()
  return fuse.run()
})

// wipe it all
Sparky.task('clean', () => Sparky.src('dist/*').clean('dist/'))
// wipe it all from .fusebox - cache dir
Sparky.task('clean-cache', () => Sparky.src('.fusebox/*').clean('.fusebox/'))

Sparky.task('copy-files', () => {
  fs.copy('app/assets', 'dist/public/assets', { overwrite: true })
})

Sparky.task('service-worker-bundle', () => {
  fuseSW = FuseBox.init({
    homeDir: 'app/',
    output: 'dist/public/$name.js',
    tsConfig : 'tsconfig.json',
    experimentalFeatures: true,
    useTypescriptCompiler: true,
    sourceMaps: false,
    cache: !isProduction,
    plugins: [
      JSONPlugin(),
      EnvPlugin({ isProduction }),
      QuantumPlugin({
        target: 'browser',
        treeshake: true,
        replaceTypeOf: false,
        bakeApiIntoBundle: 'service-worker',
        containedAPI : true,
        uglify: false,
      }),
    ],
  })
  SW = fuseSW
    .bundle('service-worker')
    .instructions('>[service-worker.ts]')
})

Sparky.task('server-bundle', () => {
  fuseServer = FuseBox.init({
    homeDir: 'server/',
    output: 'dist/server/$name.js',
    tsConfig : 'tsconfig.json',
    experimentalFeatures: true,
    useTypescriptCompiler: true,
    sourceMaps: !isProduction,
    cache: !isProduction,
    plugins: [
      JSONPlugin(),
      EnvPlugin({ isProduction }),
      isProduction && QuantumPlugin({
        target: 'npm',
        bakeApiIntoBundle: 'index',
        containedAPI: true,
        treeshake: true,
        uglify: true,
      }),
    ],
  })
  server = fuseServer
    .bundle('index')
    .instructions('>[index.ts]')
})

// prod build
Sparky.task('set-production-env', () => isProduction = true)

Sparky.task('dist', ['clean', 'clean-cache', 'set-production-env', 'config', 'copy-files', 'service-worker-bundle', 'server-bundle', 'run-server'], () => {
  fuse.dev({ port: 3001 }, setupServer)
  fuseServer.run()
  fuseSW.run()
  return fuse.run()
})

Sparky.task('run-server', () => {
  runServer()
})

function runServer () {
  const spawn = require( 'child_process' ).spawn,
  serverCmd = spawn( './node_modules/.bin/nodemon', [ 'dist/server/index.js' ] )
  serverCmd.stdout.on( 'data', data => {
    console.log( `stdout: ${data}` )
  })
  serverCmd.stderr.on( 'data', data => {
    console.log( `stderr: ${data}` )
  })
  serverCmd.on( 'close', code => {
    console.log( `child process exited with code ${code}` )
  })
}
