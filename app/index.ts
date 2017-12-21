import { _ } from 'fractal-core'
import './assets/icons-bundle.css'
import './styles.css'
import { runModule } from './module'
import * as root from './Root'
import './hmr'

let DEV = !process.env.isProduction

if (typeof window !== 'undefined') {
  navigator.serviceWorker.register('service-worker.js')
}

;(async () => {
  let app = await runModule(root, DEV)
  if (typeof window !== 'undefined') {
    ;(window as any).app = app
  }
})()
