import { _ } from 'fractal-core'
import './assets/icons-bundle.css'
import './styles.css'
import { runModule } from './module'
import * as root from './Root'
import './hmr'

let DEV = !process.env.isProduction

;(async () => {
  let app = await runModule(root, DEV)
  await app.moduleAPI.dispatch(['Root', 'toRoute', 'Home', _, 'context'])
  ;(window as any).app = app
})()
