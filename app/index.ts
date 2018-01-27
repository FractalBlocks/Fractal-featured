import './assets/icons-bundle.css'
import './styles.css'
import { runModule } from './module'
import * as Root from './Root'
import './hmr'

let DEV = !process.env.isProduction

if (typeof window !== 'undefined') {
  // navigator.serviceWorker.register('service-worker.js') // temporary disabled
}

;(async () => {
  let app = await runModule(Root, DEV)
  if (typeof window !== 'undefined') {
    ;(window as any).app = app
  }
})()
