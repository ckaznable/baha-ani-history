import { addHistory, getHistory } from "./storage"

(async () => {
  if(!window.location.pathname.includes("animeVideo.php")) {
    return
  }

  const id = getId()
  if(!id) {
    return
  }

  // make sure is started
  const _ = setInterval(() => {
    const dom = document.querySelector(".vjs-has-started")
    if(dom) {
      clearInterval(_)
      addHistory(id)
    }
  }, 1000)

  const history = await getHistory()
  if(!history.length) {
    return
  }

  const season = getSeasonDomList()

  const domList = Array.from(season)
    .filter(dom => history.includes(getSeasonId(dom)))
    .map(dom => [dom, history.indexOf(getSeasonId(dom))])

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
})()

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
