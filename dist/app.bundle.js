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
