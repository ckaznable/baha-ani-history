import {
  POST_MESSAGE,
  MARK_COLOR_BROWN,
  MARK_COLOR_GREEN,
  MARK_COLOR_YELLOW,
  MARK_COLOR_RED,
  MARK_COLOR_PURPLE,
  MARK_COLOR_WHITE,
  MARK_COLOR_ORANGE,
  MARK_COLOR_GOLD,
  MARK_COLOR_PINK,
  MARK_COLOR_BLUE,
  MARK_COLOR_CYAN,
  MARK_COLOR_BLACK,
} from "./constatnt"

import { addHistory, deleteHistory, getHistory, getMarks, addMark, deleteMark } from "./storage"
import { MARK_COLOR } from "./constatnt"

let playing = false
let blockAddToHistory = false

;(async () => {
  if(!isVideoPage()) {
    return
  }

  listenPageEvent()
  installPageListener()

  await handleHistories()
  await handleMarks()
})()

async function onChangePage() {
  if(!isVideoPage()) {
    return
  }

  blockAddToHistory = false
  playing = false
  await handleHistories()
  await handleMarks()
}

function isVideoPage() {
  return !!window.location.pathname.includes("animeVideo.php")
}

function installPageListener() {
  const path = chrome.runtime.getURL("script/injection.js")
  const dom = document.createElement("script")
  dom.src = path
  document.body.append(dom)
  dom.remove()

  window.addEventListener("message", e => {
    if(e.data != POST_MESSAGE) {
      return
    }

    onChangePage()
  })
}

function listenPlay() {
  const _ = setInterval(() => {
    const dom = document.getElementById("ani_video_html5_api")
    if(!dom) {
      return
    }

    clearInterval(_)
    dom.removeEventListener("play", handlePlay)
    dom.addEventListener("play", handlePlay)
  }, 1000)
}

function handlePlay(e) {
  if(blockAddToHistory) {
    return
  }

  if(playing) {
    return
  }

  playing = true

  const id = getId()
  id && addHistory(id)
}

function getMarkColor(color) {
  switch (color) {
    case "red":
      return MARK_COLOR_RED
    case "green":
      return MARK_COLOR_GREEN
    case "purple":
      return MARK_COLOR_PURPLE
    case "yellow":
      return MARK_COLOR_YELLOW
    case "brown":
      return MARK_COLOR_BROWN
    case "white":
      return MARK_COLOR_WHITE
    case "orange":
      return MARK_COLOR_ORANGE
    case "gold":
      return MARK_COLOR_GOLD
    case "pink":
      return MARK_COLOR_PINK
    case "blue":
      return MARK_COLOR_BLUE
    case "cyan":
      return MARK_COLOR_CYAN
    case "black":
      return MARK_COLOR_BLACK
  }
}

async function getColorMarks(color) {
  return await getMarks(color)
}

async function getAllColorMarks() {
  const marks = {}
  for(const color of MARK_COLOR) {
    marks[color] = await getColorMarks(color)
  }
  return marks
}

async function handleMarks() {
  const marks = await getAllColorMarks()
  const season = Array.from(getSeasonDomList())

  season.forEach(dom => {
    const id = getSeasonId(dom)
    Object.keys(marks).forEach(color => {
      if(!marks[color].includes(id)) {
        return
      }

      const bgColor = getMarkColor(color)
      if(bgColor) {
        dom.parentElement.style.backgroundColor = bgColor
      }
    })
  })
}

async function handleHistories() {
  listenPlay()

  const history = await getHistory()
  if(!history.length) {
    return
  }

  const season = Array.from(getSeasonDomList())

  // init
  season.forEach(dom => dom.parentElement.style.backgroundColor = "")

  const domList = season
    .filter(dom => history.includes(getSeasonId(dom)))
    .map(dom => [dom, history.indexOf(getSeasonId(dom))])

  if(!domList.length) {
    return
  }

  domList.forEach(([dom, index]) => {
    if(!dom.parentElement.classList.contains("playing")) {
      dom.parentElement.style.backgroundColor = "var(--anime-secondary-color)"
    }
    dom.removeAttribute("data-id")
  })

  if(document.querySelector("li.saw")) {
    return
  }

  domList.sort((a, b) => b - a)
  const [lastSawDom] = domList[0]
  if(!lastSawDom.parentElement.classList.contains("playing")) {
    lastSawDom.parentElement.classList.add("saw")
  }
}

function getDomWithSN(sn) {
  return Array.from(getSeasonDomList()).find(dom => dom.href.includes(`sn=${sn}`))
}

function removeEpisodeBackground(sn) {
  const dom = getDomWithSN(sn)
  if(dom) {
    dom.parentElement.style.backgroundColor = ""
  }
}

function removeMarkBg(sn) {
  MARK_COLOR.forEach(color => {
    deleteMark(sn, color)
  })

  const dom = getDomWithSN(sn)
  if(dom) {
    dom.parentElement.style.backgroundColor = ""
  }
}

function setMarkBg(sn, color) {
  addMark(sn, color)
  const dom = getDomWithSN(sn)
  const bgColor = getMarkColor(color)
  if(dom && bgColor) {
    dom.parentElement.style.backgroundColor = bgColor
  }
}

function getId() {
  const url = new URL(window.location.href)
  return url.searchParams.get("sn")
}

function getSeasonDomList() {
  return document.querySelectorAll(".season ul li a")
}

function getSeasonId(dom) {
  if(dom.dataset.id) {
    return +dom.dataset.id
  }

  const url = new URL(dom.href)
  const id = url.searchParams.get("sn")
  // cache
  dom.dataset.id = id
  return +id
}

function listenPageEvent() {
  chrome.runtime.onMessage.addListener((msg) => {
    if(!msg?.type) {
      return
    }

    switch (msg.type) {
    case "page":
      blockAddToHistory = true
      deleteHistory(getId())
      break
    case "link":
      const { sn } = msg
      deleteHistory(sn)
      removeEpisodeBackground(sn)
      break
    case "mark":
      const { sn: markSN, color, action } = msg
      action == "delete" ? removeMarkBg(markSN) : setMarkBg(markSN, color)
      break
    }
  })
}
