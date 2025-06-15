let pg = "";
if (globalThis.origin.includes("xfig.org")) {
  globalThis.location = "https://xfig.org/#z9b";
}
const display_initial = {
  "ext_details": "block",
  "help": "block",
  "nav_details": "grid",
  "dyno_page": "block",
  "index_page": "block",
  "search_details": "block",
  "legal_details": "block",
  "tag_details": "grid",
};
function vl(o) {
  try {
    return Object.keys(o)[0];
  } catch {
    return "";
  }
}
site.build = {};
for (const tri of site.t) {
  tri.reduce(
    (a, c) => {
      a[c] = a[c] || {};
      return a[c];
    },
    site.build,
  );
}
function gf_nav(gf) {
  return `<a href="#${gf.g}" 
  title="${vl(site.build[gf.g][site.p["has_label"]])}">${
    vl(site.build[gf.g][site.p["has_emoji"]])
  }</a>
  <a href="#${gf.f}" title="${vl(site.build[gf.f][site.p["has_label"]])}">${
    vl(site.build[gf.f][site.p["has_emoji"]])
  }</a>`;
}
function gf(nd) {
  try {
    const f = vl(site.build[nd][site.p["is_instance_of"]]);
    const g = vl(site.build[f][site.p["has_sup"]]);
    return {
      "f": f,
      "g": g,
    };
  } catch {
    return false;
  }
}
const all_arts = [];
for (const i in site.build) {
  if (site.build[i]?.[site.p["has_contents"]] && site.build[i]?.[site.p["has_date"]]) {
    all_arts.push([vl(site.build[i][site.p["has_date"]]), i]);
  }
}
all_arts.sort().reverse();
for (const i in site.build[site.r][site.p["has_css"]]) {
  const style = document.createElement("style");
  style.textContent = vl(site.build[i][site.p["has_text"]]);
  document.head.appendChild(style);
}
for (const i in site.build[site.r][site.p["has_html"]]) {
  document.body.insertAdjacentHTML("beforeend", vl(site.build[i][site.p["has_text"]]));
}
const tags = vl(site.build[site.r][site.p["tagged_with"]]);
let top_cats = "";
for (const i in site.build[site.r][site.p["has_sub"]]) {
  top_cats += `<a href="#${i}" title="${vl(site.build[i][site.p["has_label"]])}">${
    vl(site.build[i][site.p["has_emoji"]])
  }</a>`;
}
document.getElementById("header").innerHTML = `<div id="sites" class="txt_l">
<a href="#${site.r}" title="${vl(site.build[site.r][site.p["has_label"]])}">${
  vl(site.build[site.r][site.p["has_emoji"]])
}</a>${top_cats}
<a href="#${tags}" title="Tags">🔖</a>
<a href="#search" title="Search">🔍️</a>
<a href="#all" title="All Articles">📙</a>
<a href="https://systemsa.net/#Top.Documentation.ORNG" title="ORNG on Systems A. Net"><svg version="1.1" viewBox="0 0 133.29 133.27" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><g stroke="#232323"><path d="m14.495 27.574 52.181-26.094 52.181 26.094 13.011 58.696-32.596 45.682h-65.256l-32.596-45.682z" fill="#ffc000" stroke-width="2.6458"></path><path d="m73.47 24.224c3.543 0.5154 6.9577 1.4168 10.178 2.7051l6.3143-6.3775 7.9224 4.5738-2.3826 8.6981c2.7699 2.1266 5.2819 4.6401 7.4089 7.4098l8.695-2.3841 4.575 7.9252-6.377 6.3144c1.288 3.2216 2.19 6.6365 2.705 10.18l8.697 2.256v9.1487l-8.697 2.256c-0.515 3.543-1.417 6.9575-2.705 10.18l6.377 6.3144-4.575 7.9256-8.695-2.3845c-2.127 2.7705-4.639 5.2835-7.4089 7.4105l2.3826 8.698-7.9224 4.574-6.3143-6.378c-3.2203 1.288-6.635 2.19-10.178 2.705l-2.2546 8.698h-9.1473l-2.2546-8.698c-3.543-0.515-6.9577-1.417-10.178-2.705l-6.3129 6.378-7.9238-4.574 2.3826-8.698c-2.7699-2.127-5.2819-4.64-7.4067-7.4105l-8.6969 2.3845-4.5737-7.9256 6.3775-6.3144c-1.2885-3.222-2.1911-6.6365-2.7064-10.18l-8.697-2.256v-9.1487l8.697-2.256c0.5153-3.543 1.4179-6.9579 2.7064-10.18l-6.3775-6.3144 4.5737-7.9252 8.6969 2.3841c2.1248-2.7697 4.6368-5.2832 7.4067-7.4098l-2.3826-8.6981 7.9238-4.5738 6.3129 6.3775c3.2206-1.2883 6.6353-2.1897 10.178-2.7051l2.2546-8.6981h9.1473zm-31.308 45.876c0 13.531 10.951 24.484 24.48 24.484 13.528 0 24.48-10.953 24.48-24.484 0-13.529-10.952-24.484-24.48-24.484-13.528 0-24.48 10.954-24.48 24.484z" fill="#ff0" stroke-width="2.1166"></path><path d="m63.894 74.712c0 0.9024-0.1281 1.7403-0.5154 2.4487-0.3223 0.7729-0.8377 1.4167-1.6108 1.9967-0.7083 0.5154-1.6095 0.9673-2.705 1.2884-1.0955 0.2578-2.4475 0.4522-3.9303 0.4522-2.6405 0-4.7017-0.4522-6.1831-1.4181-1.4814-0.9025-2.4489-2.2543-2.8348-3.9949l2.7699-0.5803c0.128 0.5803 0.3858 1.0957 0.6437 1.5476 0.3224 0.4508 0.7096 0.8364 1.225 1.1589 0.5153 0.3224 1.0941 0.5803 1.8672 0.7733 0.7097 0.1294 1.6109 0.2575 2.6415 0.2575 0.8381 0 1.6112-0.0646 2.3195-0.2575 0.7082-0.1284 1.353-0.3225 1.8673-0.6435 0.5153-0.3228 0.9026-0.7098 1.1601-1.1606 0.3227-0.5151 0.4507-1.0305 0.4507-1.7389 0-0.6449-0.128-1.2252-0.4507-1.6757-0.3224-0.4509-0.7728-0.7733-1.3531-1.0957-0.5788-0.2576-1.2884-0.5154-2.0616-0.7084-0.7731-0.1926-1.6743-0.387-2.6404-0.58-0.5802-0.128-1.1601-0.3224-1.8038-0.4505-0.5802-0.1298-1.1605-0.3224-1.7393-0.5803-0.5153-0.193-1.0306-0.4505-1.4824-0.7084-0.5157-0.3224-0.9016-0.6449-1.2874-1.0954-0.3224-0.3873-0.6448-0.8378-0.8377-1.4182-0.193-0.5154-0.3224-1.1588-0.3224-1.8686 0-0.9659 0.2575-1.8684 0.6447-2.5767 0.3859-0.7084 0.9661-1.2887 1.6744-1.7392 0.7731-0.5155 1.6108-0.8379 2.5769-1.0309 0.9661-0.1943 2.0617-0.3224 3.2207-0.3224 1.2885 0 2.4485 0.1281 3.3501 0.3224 0.9657 0.193 1.7389 0.5154 2.384 0.9014 0.6433 0.4505 1.1587 0.9024 1.5459 1.5462 0.3859 0.58 0.7083 1.2884 0.9661 2.1262l-2.8347 0.5154c-0.193-0.5154-0.3873-0.9659-0.6448-1.4167-0.2578-0.387-0.6437-0.7095-1.0296-0.9673-0.4518-0.3211-0.9671-0.5155-1.6108-0.6435-0.5803-0.1295-1.3531-0.193-2.1911-0.193-0.9661 0-1.8024 0.0635-2.4475 0.2579-0.7083 0.1926-1.2236 0.3856-1.6109 0.708-0.4504 0.3225-0.7082 0.6438-0.9012 1.0308-0.1929 0.4509-0.2578 0.9028-0.2578 1.3533 0 0.6435 0.1929 1.1589 0.4508 1.5462 0.3224 0.4505 0.7731 0.773 1.2884 1.0309 0.5803 0.2575 1.2236 0.5154 1.9333 0.7084 0.7086 0.1294 1.4814 0.3224 2.2545 0.5154 0.6438 0.1294 1.2885 0.3224 1.9322 0.4519 0.7083 0.1929 1.2885 0.321 1.8687 0.5785 0.6434 0.1944 1.1587 0.4523 1.674 0.7747 0.5157 0.2576 0.9661 0.6435 1.3534 1.0309 0.3859 0.4505 0.7082 0.9659 0.9012 1.5458 0.2578 0.5155 0.3224 1.2238 0.3224 1.9971zm19.068 5.8636-2.4475-6.186h-9.6627l-2.4489 6.186h-3.0277l8.6969-21.262h3.2852l8.5675 21.262zm-6.0551-15.463c-0.1295-0.4522-0.3224-0.8378-0.4508-1.2252-0.1294-0.4505-0.2575-0.8378-0.3873-1.1589-0.0645-0.3224-0.1929-0.5803-0.2575-0.8378l-0.1283-0.3874-0.1295 0.3874c-0.0645 0.2575-0.1929 0.5154-0.3224 0.9013-0.0635 0.3225-0.1929 0.7095-0.3858 1.0954-0.1281 0.4519-0.2579 0.8379-0.4508 1.2252l-2.7064 7.0225h7.9887z" fill="#232323" stroke-width="2.1166"></path></g></svg></a>
<a href="#legal" title="Website Terms and Privacy">⚖️</a>
<a href="#help" title="Help">❓️</a>
</div>`;
pg = "⏳";
for (const i of all_arts.slice(0, 6)) {
  pg += `<div class="lines"><div class="dt">${i[0]}</div>:${
    gf_nav(gf(i[1]))
  }<a href="#${i[1]}" title="${vl(site.build[i[1]][site.p["has_label"]])} Article">${
    vl(site.build[i[1]][site.p["has_label"]])
  }</a></div>`;
}
document.getElementById("bydate").innerHTML = pg;
const fav_id = vl(site.build[site.r][site.p["favorited_with"]]);
let fav_pins = `${vl(site.build[fav_id][site.p["has_emoji"]])}`;
for (const i in site.build[fav_id][site.p["has_instance"]]) {
  fav_pins += `<div class="lines">${gf_nav(gf(i))}<a href="#${i}" title="${
    vl(site.build[i][site.p["has_label"]])
  }">${vl(site.build[i][site.p["has_label"]])}</a></div>`;
}
document.getElementById("pins").innerHTML = fav_pins;
let tinies = "";
for (const i in site.build[site.r][site.p["has_tinies"]]) {
  tinies += `<a href="${vl(site.build[i][site.p["has_link"]])}" title="${
    vl(site.build[i][site.p["has_label"]])
  }">${vl(site.build[i][site.p["has_emoji"]])}</a> `;
}
document.getElementById("tinies").innerHTML = tinies;
document.getElementById("2").checked = true;
let source_files = document.querySelector('input[name = "f"]:checked').value;
function sm(pg) {
  if (globalThis.origin.includes("localhost")) {
    return pg;
  } else {
    return pg.replace(
      /src="\/images\//g,
      'src="https://' + source_files + "images/",
    )
      .replace(/src="\/files\//g, 'src="https://' + source_files + "files/")
      .replace(/href="\/images\//g, 'href="https://' + source_files + "images/")
      .replace(/href="\/files\//g, 'href="https://' + source_files + "files/");
  }
}
globalThis.addEventListener("hashchange", () => {
  refresh();
});
function hide_other(one) {
  for (const i in display_initial) {
    one != i
      ? document.getElementById(i).style.display = "none"
      : document.getElementById(i).style.display = display_initial[i];
  }
}
document.getElementById("s0").checked = true;
function art_nav(art) {
  let cur_art = -1;
  do {
    cur_art++;
  } while (art_line[cur_art] != art && cur_art < art_line.length - 1);
  const last = art_line[0];
  const first = art_line.slice(-1);
  const next = cur_art > 0 ? art_line[cur_art - 1] : last;
  const prev = cur_art < art_line.length - 1 ? art_line[cur_art + 1] : first;
  return { "first": first, "prev": prev, "next": next, "last": last };
}
function get_nav(art) {
  const n = art_nav(art);
  return `<a href="#${n.first}">⏮️</a><a href="#${n.prev}">⏪️</a><a href="#${n.next}">⏩️</a><a href="#${n.last}">⏭️</a>`;
}
function all() {
  hide_other("dyno_page");
  let l = 0;
  pg = "<h2>All Articles:</h2>";
  for (const i of all_arts) {
    pg += `<div class="lines"><div class="dt">${i[0]}</div>:${
      gf_nav(gf(i[1]))
    }<a href="#${i[1]}">${vl(site.build[i[1]][site.p["has_label"]])}</a></div>`;
    l += vl(site.build[i[1]][site.p["has_contents"]]).length;
  }
  document.getElementById("dyno_page").innerHTML = pg + "<br>length of all: " +
    (l / 1048576).toString().slice(0, 4) + "Mi";
}
function son(art) {
  hide_other("dyno_page");
  const relatives = gf(art);
  localStorage.setItem("art", art);
  let other = "";
  let pgin = "";
  let pg_tags = "";
  if (site.build[art]?.[site.p["has_tag"]]) {
    for (const i in site.build[art][site.p["has_tag"]]) {
      pg_tags += `<a href="#${i}">#${vl(site.build[i][site.p["has_label"]])}</a> `;
    }
    for (const t in site.build[art][site.p["has_tag"]]) {
      let cur_tag = t;
      for (const j in site.build[t][site.p["tagged_in"]]) {
        if (j != art) {
          if (cur_tag != "") {
            pgin += `<p><a href="#${t}">#${vl(site.build[t][site.p["has_label"]])}</a>`;
            cur_tag = "";
          }
          pgin += `<br> &nbsp; <a href="#${j}">${
            vl(site.build[j][site.p["has_label"]])
          }</a>`;
        }
      }
    }
  }
  other = pgin.length > 0
    ? `<p>Other articles with tags:<p><div class="comments">${pgin}</div>`
    : "";
  document.getElementById("dyno_page").innerHTML = `
    <div id="hb_cont">
      <div id="header_block">
        <b><i>${vl(site.build[relatives.g][site.p["has_label"]])} | ${
    vl(site.build[relatives.f][site.p["has_label"]])
  }</i></b>
        <div id="art_header">${gf_nav(gf(art))}
          ${vl(site.build[art][site.p["has_label"]])}<br>📅 ${vl(site.build[art][site.p["has_date"]])}
          &nbsp; 
        </div>
      <div id="navigation" class="nav">${get_nav(art)}</div>
    </div>
    </div>
  <div id="art">${sm(vl(site.build[art][site.p["has_contents"]]))}</div>${pg_tags}
  <div id="end_tags"></div><div class="comments">${
    vl(site.build[art][site.p["has_comment"]])
  }${other}</div>`;
}
for (const i of [0, 1, 2]) {
  document.getElementById(`s${i}`).addEventListener(
    "input",
    () => update_art_line(),
  );
}
localStorage.setItem("art", "");
localStorage.setItem("tag_search", "");
const art_line = [];
update_art_line();
function update_art_line() {
  art_line.length = 0;
  const art = localStorage.getItem("art");
  const tag_search = localStorage.getItem("tag_search");
  for (const i of all_arts) {
    if (
      (tag_search.length == 3 && site.build[i[1]]?.[site.p["has_tag"]]?.[tag_search] ||
        tag_search == "") &&
      (
        art.length == 3 && document.getElementById("s2").checked &&
          gf(art).g == gf(i[1]).g && gf(art).f == gf(i[1]).f ||
        art.length == 3 &&
          (document.getElementById("s1").checked && gf(art).g == gf(i[1]).g) ||
        document.getElementById("s0").checked
      )
    ) art_line.push(i[1]);
  }
}
for (const i of all_arts) {
  art_line.push(i[1]);
}
document.getElementById("sel_tag").innerHTML = `Filter by search tag: --&gt; 
      <a title="Click to clear"><b></b></a> &lt;--`;
const ltags = [];
const rtags = [];
for (const i in site.build[tags][site.p["has_instance"]]) {
  ltags.push(`${
    String(Object.keys(site.build[i][site.p["tagged_in"]]).length)
      .padStart(3, "0")
  }-${vl(site.build[i][site.p["has_label"]])}-${i}`);
  rtags.push(`${vl(site.build[i][site.p["has_label"]])}-${i}`);
}
for (const i of ltags.sort().reverse()) {
  const f = i.split("-");
  document.getElementById("ltags").insertAdjacentHTML(
    "beforeend",
    `<a href="#${f[2]}" title="${f[1]}">${f[0]} - ${
      f[1]
    }</a> <div class="taggy" data-tag="${f[2]}">⛳︎</div><br>`,
  );
}
for (const i of rtags.sort()) {
  const f = i.split("-");
  document.getElementById("rtags").insertAdjacentHTML(
    "beforeend",
    `<a href="#${f[1]}" title="${f[0]}">${
      f[0]
    }</a> <div class="taggy" data-tag="${f[1]}">⛳︎</div><br>`,
  );
}
document.getElementById("tag_details").addEventListener("click", (e) => {
  if (e.target.getAttribute("data-tag")) {
    const t = e.target.getAttribute("data-tag");
    localStorage.setItem("tag_search", t);
    document.getElementById("sel_tag").innerHTML =
      `Selected search filter tag: --&gt;&gt;
    ${vl(site.build[t][site.p["has_label"]])} &lt;&lt;-- Click to clear.`;
    update_art_line();
  }
  if (e.target.getAttribute("id") == "sel_tag") {
    localStorage.setItem("tag_search", "");
    document.getElementById("sel_tag").innerHTML =
      `Selected search filter tag: --&gt;&gt; &lt;&lt;-- Click to clear.`;
    update_art_line();
  }
});
function return_matches(words) {
  const all_sets = [];
  for (const w in words) {
    all_sets.push(new Set());
    for (const i of all_arts) {
      if (vl(site.build[i[1]][site.p["has_contents"]]).match(words[w])) {
        all_sets[w].add(i[1]);
      }
    }
  }
  return all_sets.reduce((a, c) => a.intersection(c));
}
document.getElementById("search_box").addEventListener("click", function () {
  this.value = "";
});
document.getElementById("search_box").addEventListener("change", function () {
  let pg = "Search results for these terms: ";
  const srch = ["", "", ""];
  const srchterms = this.value.split(" ");
  const words = [];
  for (const p in srchterms) {
    srch[p] = srchterms[p];
    if (srch[p] != "") {
      pg += " “" + srch[p] + "”";
    }
  }
  if (srch[0] != "") words.push(new RegExp("\\W" + (srch[0]) + "\\W", "gi"));
  if (srch[1] != "") words.push(new RegExp("\\W" + (srch[1]) + "\\W", "gi"));
  if (srch[2] != "") words.push(new RegExp("\\W" + (srch[2]) + "\\W", "gi"));
  function replex(match) {
    return "<mark>" + match + "</mark>";
  }
  let i = 0;
  return_matches(words).forEach((art) => {
    i++;
    const artTitle = vl(site.build[art][site.p["has_label"]]);
    const artContent = srch[2] != ""
      ? vl(site.build[art][site.p["has_contents"]]).replace(words[2], replex).replace(
        words[1],
        replex,
      ).replace(words[0], replex)
      : srch[1] != ""
      ? vl(site.build[art][site.p["has_contents"]]).replace(words[1], replex).replace(
        words[0],
        replex,
      )
      : vl(site.build[art][site.p["has_contents"]]).replace(words[0], replex);
    const artDate = vl(site.build[art][site.p["has_date"]]);
    pg +=
      `<p><b>***** ${i.toString()} *****</b> <a href="#${art}">${artDate} : ${artTitle}</a><br>
     <div class="ind1">${artContent}</div>`;
  });
  document.getElementById("search_results").innerHTML = i == 25
    ? `<p><b>***** ${i.toString()} *****</b>
  reached max total matches of 25.<p>${sm(pg)}`
    : `<p><b>***** ${i.toString()} *****</b> total matches.<p>${sm(pg)}`;
});
refresh();
function father(nd) {
  hide_other("dyno_page");
  pg = `<h2>${vl(site.build[nd][site.p["has_emoji"]])} ${
    vl(site.build[nd][site.p["has_label"]])
  }</h2 >`;
  for (const i of all_arts) {
    if (vl(site.build[i[1]][site.p["is_instance_of"]]) == nd) {
      pg += `<div class="lines"> <div class="dt">${i[0]}</div>:${
        gf_nav(gf(i[1]))
      } <a href="#${i[1]}">${vl(site.build[i[1]][site.p["has_label"]])}</a></div> `;
    }
  }
  document.getElementById("dyno_page").innerHTML = pg;
}
function grandfather(nd) {
  hide_other("dyno_page");
  pg = `<h2>${vl(site.build[nd][site.p["has_emoji"]])} ${
    vl(site.build[nd][site.p["has_label"]])
  }</h2 >`;
  for (const i in site.build[nd][site.p["has_sub"]]) {
    pg += `<div class="lines"><a href="#${i}">${vl(site.build[i][site.p["has_emoji"]])}${
      vl(site.build[i][site.p["has_label"]])
    }</a></div> `;
  }
  document.getElementById("dyno_page").innerHTML = pg;
}
function search() {
  hide_other("search_details");
  document.getElementById("search_box").value = "🔍️ <= 3 words";
}
function tag(nd) {
  hide_other("dyno_page");
  let pg = `Tags | ${vl(site.build[nd][site.p["has_label"]])}`;
  if (nd == "z9b") pg += `${vl(site.build["vjk"]["c55"])}`;
  for (const i of all_arts) {
    if (i[1] in site.build[nd][site.p["tagged_in"]]) {
      pg += `<div class="lines"><div class="dt">${i[0]}</div>:${
        gf_nav(gf(i[1]))
      }<a href="#${i[1]}" title="${vl(site.build[i[1]][site.p["has_label"]])} Article">${
        vl(site.build[i[1]][site.p["has_label"]])
      }</a></div>`;
    }
  }
  document.getElementById("dyno_page").innerHTML = pg;
}
function export_site(){
  hide_other("index_page");
  const blob = new Blob([JSON.stringify(site,null,2)], { type: 'application/octet-stream' });
 const url = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = url;
 link.download = "export_site.txt";
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(url);
}
function refresh() {
  const hash = globalThis.location.hash.substring(1) || "home";
  source_files = document.querySelector('input[name = "f"]:checked').value;
  const lbl = vl(site.build?.[hash]?.[site.p?.["has_label"]]);
  gf(hash)
    ? son(hash)
    : site.build?.[hash]?.[site.p?.["tagged_in"]]
    ? tag(hash)
    : hash == site.r
    ? hide_other("index_page")
    : hash == "all"
    ? all()
    : hash == "search"
    ? search()
    : hash=="export-site"
    ? export_site()
    : hash == "help"
    ? hide_other("help")
    : hash == "legal"
    ? hide_other("legal_details")
    : lbl == "Tags"
    ? hide_other("tag_details")
    : site.build?.[hash]?.[site.p?.["has_sup"]] && site.build?.[hash]?.[site.p?.["has_sub"]]
    ? grandfather(hash)
    : site.build?.[hash]?.[site.p?.["has_instance"]] && site.build?.[hash]?.[site.p?.["has_sup"]]
    ? father(hash)
    : hide_other("index_page");
}
document.addEventListener("keydown", (e) => {
  if ("ArrowRightArrowLeftArrowUpArrowDown".includes(e.key)) {
    const hash = globalThis.location.hash.substring(1) || "home";
    if (gf(hash)) {
      e.key == "ArrowRight"
        ? globalThis.location = "#" + art_nav(hash).next
        : e.key == "ArrowLeft"
        ? globalThis.location = "#" + art_nav(hash).prev
        : document.getElementById("end_tags").scrollIntoView(false);
    }
  }
});
