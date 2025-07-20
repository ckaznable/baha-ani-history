import { getHistory } from "./storage"
import { CompressedStorage } from "./storage/compress"
import { MARK_COLOR } from "./constatnt"

const URL_PATTERN = "https://ani.gamer.com.tw/animeVideo.php?sn=*"
const MARK_EP_CONTEXT_MENU_ID = "anime.mark"

const markHandlers = MARK_COLOR.reduce((acc, color) => ({
  ...acc,
  [color]: contextMarkEPCallback(color)
}), {})

function getId(linkUrl) {
  const url = new URL(linkUrl)
  return url.searchParams.get("sn")
}

function contextPageCallback({ menuItemId }, tab) {
  if(menuItemId !== "anime.history.page.remove") {
    return
  }

  chrome.tabs.sendMessage(tab.id, { type: "page" })
}

function contextLinkCallback({ linkUrl, menuItemId }, tab) {
  if(menuItemId !== "anime.history.link.remove") {
    return
  }

  try {
    const sn = getId(linkUrl)
    chrome.tabs.sendMessage(tab.id, { type: "link", sn })
  } catch(e) {}
}

function contextMarkEPCallback(color) {
  return ({ linkUrl, menuItemId }, tab) => {
    if(menuItemId !== `${MARK_EP_CONTEXT_MENU_ID}.${color}`) {
      return
    }

    try {
      const sn = getId(linkUrl)
      chrome.tabs.sendMessage(tab.id, { type: "mark", sn, action: "mark", color })
    } catch(e) {}
  }
}

function contextCancelMarkCallback({ linkUrl, menuItemId }, tab) {
    if(menuItemId !== `${MARK_EP_CONTEXT_MENU_ID}.cancel`) {
      return
    }

    try {
      const sn = getId(linkUrl)
      chrome.tabs.sendMessage(tab.id, { type: "mark", sn, action: "delete" })
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

function initMarkEPContextMenu() {
  // parent
  chrome.contextMenus.remove(MARK_EP_CONTEXT_MENU_ID)
  chrome.contextMenus.create({
    id: MARK_EP_CONTEXT_MENU_ID,
    title: "標記這集顏色",
    contexts: ["link"],
    targetUrlPatterns: [URL_PATTERN],
  })


  chrome.contextMenus.onClicked.removeListener(contextCancelMarkCallback)
  chrome.contextMenus.onClicked.addListener(contextCancelMarkCallback)
  const cancelMarkId = `${MARK_EP_CONTEXT_MENU_ID}.cancel`
  chrome.contextMenus.remove(cancelMarkId)
  chrome.contextMenus.create({
    id: cancelMarkId,
    parentId: MARK_EP_CONTEXT_MENU_ID,
    title: "取消標記",
    contexts: ["link"],
    targetUrlPatterns: [URL_PATTERN],
  })

  MARK_COLOR.forEach(initMarkColorMenu)
}

function initMarkColorMenu(color) {
  const fn = markHandlers[color]
  chrome.contextMenus.onClicked.removeListener(fn)
  chrome.contextMenus.onClicked.addListener(fn)

  const id = `${MARK_EP_CONTEXT_MENU_ID}.${color}`
  chrome.contextMenus.remove(id)
  chrome.contextMenus.create({
    id,
    parentId: MARK_EP_CONTEXT_MENU_ID,
    title: getColorTitle(color),
    contexts: ["link"],
    targetUrlPatterns: [URL_PATTERN],
  })
}

function contextIndexPageCallback({ menuItemId }, tab) {
  if(menuItemId !== "index.only_show_fav") {
    return
  }

  try {
    chrome.tabs.sendMessage(tab.id, { type: "index" })
  } catch(e) {}
}

function initIndexPageContextMenu() {
  chrome.contextMenus.onClicked.removeListener(contextIndexPageCallback)
  chrome.contextMenus.onClicked.addListener(contextIndexPageCallback)

  const id = "index.only_show_fav"
  chrome.contextMenus.remove(id)
  chrome.contextMenus.create({
    id,
    title: "只顯示收藏的動畫",
    contexts: ["page"],
    documentUrlPatterns: ["https://ani.gamer.com.tw/"],
  })
}

function getColorTitle(color) {
  switch (color) {
    case "red":
      return "紅色"
    case "green":
      return "綠色"
    case "purple":
      return "紫色"
    case "yellow":
      return "黃色"
    case "brown":
      return "咖啡色"
    case "white":
      return "白色"
    case "orange":
      return "橘色"
    case "gold":
      return "金色"
    case "pink":
      return "粉紅色"
    case "blue":
      return "藍色"
    case "cyan":
      return "青色"
    case "black":
      return "黑色"
  }
}

function initContextMenu() {
  initPageContextMenu()
  initLinkContextMenu()
  initMarkEPContextMenu()
  initIndexPageContextMenu()
}

async function migrateToDataVersionV1() {
  const dataVersion = await (() => {
    return new Promise(resolve => {
      chrome.storage.local.get("version", (items) => {
        resolve(items.version)
      })
    })
  })()

  if(dataVersion === 1) {
    return
  }

  const history = await (async () => {
    return new Promise(resolve => {
      chrome.storage.sync.get("history", items => {
        resolve(items?.history || [])
      })
    })
  })()

  // backup
  chrome.storage.local.set({history})

  const historyOnSync = await getHistory()
  if (!historyOnSync || !historyOnSync.length) {
    const storage = new CompressedStorage()
    await storage.migrate("history", history)
  }

  await chrome.storage.local.set({version: 1})
}

;(async () => {
  await migrateToDataVersionV1()
  initContextMenu()
})()
