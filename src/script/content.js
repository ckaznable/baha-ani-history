import { POST_MESSAGE } from "./constatnt"
import { addHistory, deleteHistory, getHistory } from "./storage"

let playing = false
let blockAddToHistory = false

;(() => {
  if(!isVideoPage()) {
    return
  }

  listenPageEvent()
  run()
  installPageListener()
})()

function onChangePage() {
  if(!isVideoPage()) {
    return
  }

  blockAddToHistory = false
  playing = false
  run()
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

async function run() {
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

function getId() {
  const url = new URL(window.location.href)
  return url.searchParams.get("sn")
}

function getSeasonDomList() {
  return document.querySelectorAll(".season ul li a")
}

function getSeasonId(dom) {
  if(dom.dataset.id) {
    return dom.dataset.id
  }

  const url = new URL(dom.href)
  const id = url.searchParams.get("sn")
  // cache
  dom.dataset.id = id
  return id
}

function listenPageEvent() {
  // 目前事件只會有取消這次觀看紀錄
  chrome.runtime.onMessage.addListener(() => {
    blockAddToHistory = true
    deleteHistory(getId())
  })
}