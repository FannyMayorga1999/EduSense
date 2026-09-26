import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

/**
 * Laravel Echo client connected to the Laravel Reverb server (WebSocket).
 * Values are read from the VITE_REVERB_* environment variables.
 *
 * @author Fanny Mayorga
 * @date   16-09-2026
 */

const REVERB_KEY = import.meta.env.VITE_REVERB_APP_KEY ?? 'edusense-key'
const REVERB_HOST = import.meta.env.VITE_REVERB_HOST ?? 'localhost'
const REVERB_PORT = Number.parseInt(import.meta.env.VITE_REVERB_PORT ?? '8080', 10)
const REVERB_SCHEME = import.meta.env.VITE_REVERB_SCHEME ?? 'http'

;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

const echo = new Echo({
  broadcaster: 'reverb',
  key: REVERB_KEY,
  wsHost: REVERB_HOST,
  wsPort: REVERB_PORT,
  forceTLS: REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
})

export default echo