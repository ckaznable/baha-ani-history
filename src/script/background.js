import { init as initStorage } from "./storage"

function contextCallback(info, tab) {
  chrome.tabs.sendMessage(tab.id, undefined)
}

function initContextMenu() {
  chrome.contextMenus.onClicked.removeListener(contextCallback)
  chrome.contextMenus.onClicked.addListener(contextCallback)

  const id = "anime.history.remove"
  chrome.contextMenus.remove(id)
  chrome.contextMenus.create({
    id,
    title: "移除這集觀看紀錄",
    documentUrlPatterns: ["https://ani.gamer.com.tw/animeVideo.php?sn=*"],
  })
}

;(() => {
  initStorage()
  initContextMenu()
})()
