import { init as initStorage } from "./storage"

const URL_PATTERN = "https://ani.gamer.com.tw/animeVideo.php?sn=*"

function contextPageCallback(_, tab) {
  chrome.tabs.sendMessage(tab.id, { type: "page" })
}

function contextLinkCallback({ linkUrl }, tab) {
  try {
    const url = new URL(linkUrl)
    const sn = url.searchParams.get("sn")
    chrome.tabs.sendMessage(tab.id, { type: "link", sn })
  } catch(e) {}
}

function initPageContextMenu() {
  chrome.contextMenus.onClicked.removeListener(contextPageCallback)
  chrome.contextMenus.onClicked.addListener(contextPageCallback)

  const id = "anime.history.page.remove"
  chrome.contextMenus.remove(id)
  chrome.contextMenus.create({
    id,
    title: "移除本頁觀看紀錄",
    contexts: ["page"],
    documentUrlPatterns: [URL_PATTERN],
  })
}

function initLinkContextMenu() {
  chrome.contextMenus.onClicked.removeListener(contextLinkCallback)
  chrome.contextMenus.onClicked.addListener(contextLinkCallback)

  const id = "anime.history.link.remove"
  chrome.contextMenus.remove(id)
  chrome.contextMenus.create({
    id,
    title: "移除這集觀看紀錄",
    contexts: ["link"],
    targetUrlPatterns: [URL_PATTERN],
  })
}

function initContextMenu() {
  initPageContextMenu()
  initLinkContextMenu()
}

;(() => {
  initStorage()
  initContextMenu()
})()
