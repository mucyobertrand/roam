import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'fb47orcg',
    dataset: 'production'
  },
  /** Hosted Studio at https://roam-app-stays.sanity.studio (Sanity Context needs a deployed Studio). */
  studioHost: 'roam-app-stays',
  deployment: {
    appId: 'aao0bofsfkftlchv0qhpghmx',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
