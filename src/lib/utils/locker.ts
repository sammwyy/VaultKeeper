const { ResourceType, RuleActionType } = chrome.declarativeNetRequest

function createRule(id: number, urlFilter: string) {
  return {
    id,
    priority: 1,
    action: {
      type: RuleActionType.REDIRECT,
      redirect: {
        url: chrome.runtime.getURL('unlock.html'),
      },
    },
    condition: {
      excludedRequestDomains: ['localhost'],
      urlFilter,
      resourceTypes: [
        ResourceType.MAIN_FRAME,
        ResourceType.SUB_FRAME,
        ResourceType.IMAGE,
        ResourceType.XMLHTTPREQUEST,
        ResourceType.WEBSOCKET,
      ],
    },
  }
}

export function unlockBrowser() {
  chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [1, 2],
  })
}

export function lockBrowser() {
  const http = createRule(1, 'http://*/*')
  const https = createRule(2, 'https://*/*')

  chrome.declarativeNetRequest.updateSessionRules({
    addRules: [http, https],
    removeRuleIds: [1, 2],
  })
}
