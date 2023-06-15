import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  name: 'vault-keeper',
  description: 'Keep safe your credentials in the browser.',
  version: '0.0.1',
  manifest_version: 3,
  icons: {
    '16': 'img/logo-16.png',
    '32': 'img/logo-34.png',
    '48': 'img/logo-48.png',
    '128': 'img/logo-128.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: 'img/logo-48.png',
  },
  options_page: 'unlock.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  web_accessible_resources: [
    {
      resources: ['img/logo-16.png', 'img/logo-34.png', 'img/logo-48.png', 'img/logo-128.png'],
      matches: [],
    },
  ],
  permissions: ['declarativeNetRequest', 'declarativeNetRequestFeedback', 'storage'],
  host_permissions: ['<all_urls>'],
})
