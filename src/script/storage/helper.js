import { CompressedStorage } from "./compress"

const historyStorage = new CompressedStorage()
const markStorage = new CompressedStorage()

export function getHistory() {
  return historyStorage.getAll("history")
}

export async function addHistory(id) {
  await historyStorage.set("history", +id)
}

export async function deleteHistory(id) {
  await historyStorage.delete("history", +id)
}

export async function includesHistory(id) {
  return historyStorage.includes("history", +id)
}

export function getMarks(color = "") {
  return markStorage.getAll(`marks:${color}`)
}

export async function addMark(id, color = "") {
  await markStorage.set(`marks:${color}`, +id)
}

export async function deleteMark(id, color = "") {
  await markStorage.delete(`marks:${color}`, +id)
}

export async function includesMark(id, color = "") {
  return markStorage.includes(`marks:${color}`, +id)
}

export async function setHistory(history) {
  await historyStorage.migrate("history", history)
}

export async function setMarks(color = "", marks) {
  await markStorage.migrate(`marks:${color}`, marks)
}
