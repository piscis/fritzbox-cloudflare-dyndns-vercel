import { fritzDynDnsRoute } from './procedures/fritz-dyndns'
import { healthCheck } from './procedures/health-check'

export const router = {
  api: {
    fritzDynDnsRoute,
    healthCheck,
  },
}
