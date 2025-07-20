import { execSync } from "child_process"
import fs from "fs"
import manifestBase from "../src/manifest.base.json" with { type: "json" }
import manifestV2 from "../src/manifest.v2.json" with { type: "json" }
import manifestV3 from "../src/manifest.v3.json" with { type: "json" }
import manifestSafari from "../src/manifest.safari.json" with { type: "json" }
import pkg from "../package.json" with { type: "json" }

const env = process.env.NODE_ENV || "production"
const manifestVersion = process.env.MANIFEST_VERSION || 3
const browser = process.env.BROWSER || "chrome"

const isProduction = env === "production"

if(isProduction) {
  // clear dist folder
  fs.mkdirSync("./dist", { recursive: true })
}

// copy assets
const assetsPath = [
  "_locales",
  "icons",
  "assets",
  "style"
]

for (const path of assetsPath) {
  fs.cpSync(`./src/${path}`, `./dist/${path}`, { recursive: true })
}

// copy .html file
fs.cpSync(`./src/background.html`, `./dist/background.html`, { recursive: true })
fs.cpSync(`./src/options.html`, `./dist/options.html`, { recursive: true })

// build dist
execSync(`npx cross-env NODE_ENV=${env} MANIFEST_VERSION=${manifestVersion} BROWSER=${browser} rollup -c`, {stdio: 'inherit'})

// build manifest
let manifest = manifestBase
if(+manifestVersion === 3) {
  manifest = {...manifest, ...manifestV3}
}

if(+manifestVersion === 2) {
  manifest = {...manifest, ...manifestV2}
}

if(browser === "safari") {
  manifest = {...manifest, ...manifestSafari}
}

manifest.version = pkg.version

fs.writeFileSync("dist/manifest.json", JSON.stringify(manifest))
