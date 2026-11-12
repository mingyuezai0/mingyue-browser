import type { MingyuePlugin } from './api'
import { adblockPlugin } from './adblock'

/**
 * Built-in plugin registry.
 *
 * To add a plugin, implement `MingyuePlugin` and append it here. The plugin is
 * then listed in the Plugins page and can be enabled/disabled by users.
 */
export const builtinPlugins: MingyuePlugin[] = [adblockPlugin]
