const emoji = "🍊"
const domain = "orng.org"
const backup = "CL_ORN_BACKUP"
const dt = new Date()
const tss = dt.toISOString().replaceAll(":", "").replaceAll("-", "").replaceAll(".","",)
let lines = [
  `${" ".repeat((120 - domain.length) / 2)}${domain.toUpperCase()} ${tss}`,
  "This image includes website knowledge as triples. Normally, this file is named with <UTC timestamp>-<Adler32>.png. Use OpenSSL to verify the RSA-PSS sig-",
  "nature using the same name with a .txt extension. The Adler32 checksum is 20 bytes in from the end of the PNG, and can be verified with a binary editor.",
  " ".repeat(37) +
  "-> If possible, verify the image at floppypng.com before loading. <-",
  `The triples and code to render can be extracted using Deno. Run: Deno.writeFileSync("u.z",Deno.readFileSync("<UTC timestamp>-<Adler32>.png").slice(41,-16))`,
  `Extract with pigz. The extracted data, u, has a null (0x00) at the beginning of each line of 5465 characters. These can be removed automatically with this:`,
  `let i,n=5465,x='',b=Deno.readFileSync("u");for(i=n*130;i<b.length;i+=n){x+=new TextDecoder().decode(b.slice(i+1,i+n))};Deno.writeTextFile("u.js",x.trim())`,
]
import { UPNG } from "upng-js"
import * as px from "pxxl"
import * as base64 from "byte-base64";
//let px = await import("./pxxl.min.js")
//import "./pako.min.js"
//import { UPNG } from "./upng.min.js"
let now_text = Deno.readTextFileSync("site.txt").trim()
let future_text = ""
for (let i of now_text.split("\n")) {
  i.slice(0, 12) == '["m1k","wsx"'
    ? future_text += `["m1k","wsx",${
      JSON.stringify(Deno.readTextFileSync("assets/style.css").trim())
    }],\n`
    : i.slice(0, 12) == '["mn2","wsx"'
    ? future_text += `["mn2","wsx",${
      JSON.stringify(Deno.readTextFileSync("assets/page.html").trim())
    }],\n`
    : future_text += `${i}\n`
}
Deno.writeTextFileSync("site.txt", future_text)
let text = Deno.readTextFileSync("site.txt") + Deno.readTextFileSync("dist/app.bundle.js")
const pf = px.Pxxl.Font.ParseBDF(Deno.readTextFileSync("assets/8x16.bdf"))
const f_sites = 2
const f_tracks = 80
const f_sectors = 18
const f_bytes = 512
const bl = [0, 0, 0, 255]
const tl = [0, 153, 136, 255]
const cy = [51, 187, 238, 255]
const or = [238, 119, 51, 255]
const mg = [238, 51, 119, 255]
const shift = 496
const dat = new TextEncoder().encode(text)
const num_lines = 7
const width = 5464
const font_height = 16
const line_below = 1
const top_padding = 6
const bottom_padding = 5
const head_length = width *
  (num_lines * (font_height + line_below) + top_padding + bottom_padding)
console.log(
  `1.44 MB Floppy Disk Size=${f_sites * f_tracks * f_sectors * f_bytes}`,
)
function arr_to_hex(u8arr) {
  return `${Array.from(u8arr, (i) => i.toString(16).padStart(2, "0")).join("")}`
}
const lwidth = 120
const factor = .06
const lstart = lwidth * 272
let logo = new Uint8Array(lwidth * 4 * lwidth).fill(255)
let llines = ["     FLOPPY", "      PNG"]
function fc(c, i, j) {
  let dc = [128, 128, 128, 255]
  dc[Math.floor(Math.random() * (3))] = 255
  let colors = [
    [255, 255, 255, 255],
    dc,
    [0, 153, 136, 255],
    [187, 187, 187, 255],
  ]
  for (let k = 0; k < 4; k++) {
    logo[i * 4 + lwidth * 4 * j + k] = colors[c][k]
  }
}
for (let i = 0; i < lwidth; i++) {
  for (let j = 0; j < lwidth; j++) {
    if (i < 17 * lwidth * factor) fc(2, i, j)
    if (
      4 * lwidth * factor < i && i < 13 * lwidth * factor && 0 <= j &&
      j < 6 * lwidth * factor
    ) fc(3, i, j)
    if (
      3 * lwidth * factor < i && i < 14 * lwidth * factor &&
      7 * lwidth * factor < j && j < 16 * lwidth * factor
    ) fc(1, i, j)
    if (
      i < 11 * lwidth * factor && i > 9 * lwidth * factor &&
      j < 5 * lwidth * factor && j > 8
    ) fc(2, i, j)
    if (
      5.2 * lwidth * factor < i && i < 12.2 * lwidth * factor &&
      9.2 * lwidth * factor < j && j < 13.8 * lwidth * factor
    ) fc(0, i, j)
  }
}
for (let line in llines) {
  const offset = line == 0 ? 0 : 16
  let pixels = pf.getPixels(llines[line])
  for (let pixel of pixels) {
    for (let i = 0; i < 4; i++) {
      logo[
        offset + lstart - 4 + lwidth * 4 * 16 * line +
        (pixel.x + pixel.y * lwidth) * 4 + i
      ] = bl[i]
    }
  }
}
const head = new Uint8Array(head_length).fill(255)
const dat_rows = (dat.length) % width == 0
  ? (dat.length) / width
  : Math.floor(dat.length / width) + 1
const dat_fill = new Uint8Array(dat_rows * width - dat.length).fill(
  32,
)
const flp_dat_arr = new Uint8Array([
  ...head,
  ...dat,
  ...dat_fill,
])
const start = width * top_padding
for (let line in lines) {
  const c = line == 0 ? or : line > 0 && line < 3 ? tl : line == 3 ? mg : cy
  let pixels = pf.getPixels(lines[line])
  for (let pixel of pixels) {
    for (let i = 0; i < 4; i++) {
      flp_dat_arr[
        start + shift + line * (font_height + line_below) * width +
        (pixel.x + pixel.y * width / 4) * 4 + i
      ] = c[i]
    }
  }
}
let ptr = 0
let y = 0
for (let x = start; x < start + width * 119; x++) {
  if (x % width == 0) {
    ptr = 0
    y++
  }
  if (ptr < 120 * 4) flp_dat_arr[x] = logo[y * 120 * 4 + ptr]
  ptr++
}
let img = new Uint8Array(
  UPNG.encode(
    [flp_dat_arr],
    width / 4,
    dat_rows + top_padding + bottom_padding +
      (font_height + line_below) * num_lines,
    0,
  ),
)
let a32h = arr_to_hex(img.slice(-20, -16))
console.log(`Generated FloppyPNG Size=${img.length}`)

const priv = Deno.readTextFileSync(Deno.env.get("CL_PRIV")).replace(
  /.*KEY-----(.+?)-----END.*/smg,
  "$1",
)
const b_der_str = globalThis.atob(priv)
const b_der = Uint8Array.from([...b_der_str].map((c) => c.charCodeAt())).buffer
const prv = await globalThis.crypto.subtle.importKey(
  "pkcs8",
  b_der,
  {
    name: "RSA-PSS",
    hash: "SHA-256",
  },
  true,
  ["sign"],
)
const sig = await crypto.subtle.sign(
  {
    name: "RSA-PSS",
    hash: "SHA-256",
    saltLength: 32,
  },
  prv,
  img,
)
const u8sig = new Uint8Array(sig)
const page = Deno.readTextFileSync("assets/pageops.html")
Deno.writeFileSync(`${tss}-${a32h}.png`, img)
Deno.writeTextFileSync(`${tss}-${a32h}.txt`, base64.bytesToBase64(u8sig))
Deno.writeFileSync(`${Deno.env.get(backup)}${tss}-${a32h}.png`, img)
for await (const i of Deno.readDir("./")) {
  if (
    i.name != `${tss}-${a32h}.png` && i.name.match(/^\d{8}T\d{9}Z\-\w{8}.png$/)
  ) {
    console.log(`removing ${i.name}`)
    Deno.remove(i.name)
  }
  if (
    i.name != `${tss}-${a32h}.txt` && i.name.match(/^\d{8}T\d{9}Z\-\w{8}.txt$/)
  ) {
    console.log(`removing ${i.name}`)
    Deno.remove(i.name)
  }
}
Deno.writeTextFileSync(
  `${domain}.page.html`,
  page
    .replaceAll("thisisimage", `${tss}-${a32h}`)
    .replaceAll(
      "thisisdatstart",
      (top_padding + bottom_padding + (font_height + line_below) * num_lines) *
        (width + 1),
    )
    .replaceAll("unfilteredlinewidth", width + 1)
    .replaceAll("thisisemoji", emoji),
)
function web_deal(req) {
  if (req.method == "GET") {
    const u = new URL(req.url)
    const page = u.pathname == "/"
      ? `orng.org.page.html`
      : u.pathname.replace("/", "")
    let npg
    let response
    try {
      console.log(page)
      npg = Deno.readFileSync(page)
      const type = page.split(".").slice(-1)
      response = new Response(npg, {
        status: 200,
        headers: {
          "content-type": types[type],
        },
      })
    } catch {
      console.log("error 404")
      response = new Response(npg, {
        status: 404,
        headers: {
          "content-type": "text/plain;charset=utf-8",
        },
      })
    }
    return response
  }
}
const types = {
  "js": "text/javascript;charset=utf-8",
  "css": "text/css",
  "svg": "image/svg+xml",
  "html": "text/html",
  "map": "application/json",
  "json": "application/json",
  "xz": "application/gzip",
  "png": "image/png",
  "zst": "application/zstd",
  "txt": "text/plain",
  "jpg": "image/jpg",
  "gif": "image/gif",
  "WebM": "video/webm",
  "mp4": "video/mp4",
  "mpg": "video/mp4",
  "webm": "video/webm",
  "ico": "image/x-icon",
}
Deno.serve({
  port: 3052,
  hostname: "0.0.0.0",
  handler: (req) => web_deal(req),
})
