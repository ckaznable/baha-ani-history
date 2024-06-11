export async function init() {
  const history = await getHistory()
  if(!history) {
    chrome.storage.sync.set({history: []})
  }
}

export function getHistory() {
  return new Promise(resolve => {
    chrome.storage.sync.get("history", items => {
      resolve(items?.history || [])
    })
  })
}

export function setHistory(history) {
  return chrome.storage.sync.set({history})
}

async function editHistory(id, isAdd) {
  const list = await getHistory()
  if(!list || !Array.isArray(list)) {
    return
  }

  const set = new Set(list)
  set.delete(id)
  isAdd && set.add(id)
  await setHistory(Array.from(set))
}

export async function addHistory(id) {
  await editHistory(id, true)
}

export async function deleteHistory(id) {
  await editHistory(id, false)
}