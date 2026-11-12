import ReactDOM from 'react-dom/client'
import '@fontsource-variable/manrope'
import '@fontsource-variable/fraunces'
import '@fontsource-variable/fraunces/wght-italic.css'
import './styles.css'
import App from './App'
import { installMobileBridge } from './lib/mobileBridge'

installMobileBridge()

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
