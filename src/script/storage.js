export async function init() {
  const history = await getHistory()
  if(!history) {
    chrome.storage.sync.set({history: []})
  }
}

export function getHistory() {
  return new Promise(resolve => {
    chrome.storage.sync.get("history", items => {
      resolve(items.history) 
    })
  })
}

export function setHistory(history) {
  return chrome.storage.sync.set({history})
}

export async function addHistory(id) {
  const list = await getHistory()
  if(!list || !Array.isArray(list)) {
    return
  }

  const set = new Set(list)
  set.delete(id)
  set.add(id)
  await setHistory(Array.from(set))
}
