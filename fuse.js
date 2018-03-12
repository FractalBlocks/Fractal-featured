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

let fuse, fuseSW, fuseServer, app, vendor, SW, server
let isProduction = false

const setupServer = server => {
  const app = server.httpServer.app
  app.use('/assets/', express.static(path.join(__dirname, 'assets')))
}

Sparky.task('config', () => {
  fuse = FuseBox.init({
    target: 'browser@esnext',
    homeDir: '.',
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

  // vendor
  vendor = fuse.bundle('vendor').instructions('~ app/index.ts')

  // bundle app
  app = fuse.bundle('app')
    // .splitConfig({ browser: '/static/bundles/', server : 'dist/public/', dest: 'bundles/' })
    .instructions('> [app/index.ts] + [app/**/**.ts]')
})

// main task
Sparky.task('default', ['clean', 'config', 'copy-files', 'service-worker-bundle', 'server-bundle', 'run-server'], () => {
  fuse.dev({ port: 3001 }, setupServer)
  let typeHelper = TypeHelper({
    tsConfig: './tsconfig.json',
    basePath:'.',
    name: 'App typechecker',
  })
  app.watch('app/**/*.ts').hmr().completed(proc => {
    console.log(`\x1b[36m%s\x1b[0m`, `client bundled`)
    typeHelper.runSync()
  })
  SW.watch('app/**/*.ts')
  server.watch('server/**/*.ts')

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

// Outdated! (TODO)
Sparky.task('service-worker-bundle', () => {
  fuseSW = FuseBox.init({
    homeDir: '.',
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
    .instructions('>[app/service-worker.ts]')
})

Sparky.task('server-bundle', () => {
  fuseServer = FuseBox.init({
    target: 'server@esnext',
    homeDir: '.',
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
    .instructions('>[server/index.ts]')
})

// prod build
Sparky.task('set-production-env', () => isProduction = true)

Sparky.task('aot', () => {
  let fuse = FuseBox.init({
    homeDir: '.',
    output: 'dist/public/$name.js',
    tsConfig : './aot/tsconfig.json',
    experimentalFeatures: true,
    useTypescriptCompiler: true,
    sourceMaps: false,
    cache: false,
    plugins: [
      EnvPlugin({ ENV: 'production' }),
    ],
  })

  fuse.bundle('aot').instructions('> aot/index.ts')

  fuse.run().then(() => {
    console.log('Running AOT compilation ...')
    const spawn = require( 'child_process' ).spawn
    const serverCmd = spawn( 'node', [ 'dist/public/aot' ] )
    serverCmd.stdout.on( 'data', data => {
      console.log( `stdout: ${data}` )
    })
    serverCmd.stderr.on( 'data', data => {
      console.log( `stderr: ${data}` )
    })
    serverCmd.on( 'close', code => {
      console.log( `child process exited with code ${code}` )
    })
  })
})

Sparky.task('dist', ['clean', 'clean-cache', 'set-production-env', 'config', 'copy-files', 'server-bundle', 'run-server'], () => {
  fuse.dev({ port: 3001 }, setupServer)
  fuseServer.run()
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
