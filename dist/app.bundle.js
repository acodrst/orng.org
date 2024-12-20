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
const site = {};
for (const tri of t) {
  tri.reduce(
    (a, c) => {
      a[c] = a[c] || {};
      return a[c];
    },
    site,
  );
}
function gf_nav(gf) {
  return `<a href="#${gf.g}" 
  title="${vl(site[gf.g][p["has_label"]])}">${
    vl(site[gf.g][p["has_emoji"]])
  }</a>
  <a href="#${gf.f}" title="${vl(site[gf.f][p["has_label"]])}">${
    vl(site[gf.f][p["has_emoji"]])
  }</a>`;
}
function gf(nd) {
  try {
    const f = vl(site[nd][p["is_instance_of"]]);
    const g = vl(site[f][p["has_sup"]]);
    return {
      "f": f,
      "g": g,
    };
  } catch {
    return false;
  }
}
const all_arts = [];
for (const i in site) {
  if (site[i][p["has_contents"]] && site[i][p["has_date"]]) {
    all_arts.push([vl(site[i][p["has_date"]]), i]);
  }
}
all_arts.sort().reverse();
for (const i in site[r][p["has_css"]]) {
  const style = document.createElement("style");
  style.textContent = vl(site[i][p["has_text"]]);
  document.head.appendChild(style);
}
for (const i in site[r][p["has_html"]]) {
  document.body.insertAdjacentHTML("beforeend", vl(site[i][p["has_text"]]));
}
const tags = vl(site[r][p["tagged_with"]]);
let top_cats = "";
for (const i in site[r][p["has_sub"]]) {
  top_cats += `<a href="#${i}" title="${vl(site[i][p["has_label"]])}">${
    vl(site[i][p["has_emoji"]])
  }</a>`;
}
document.getElementById("header").innerHTML = `<div id="sites" class="txt_l">
<a href="#${r}" title="${vl(site[r][p["has_label"]])}">${
  vl(site[r][p["has_emoji"]])
}</a>${top_cats}
<a href="#${tags}" title="Tags">🔖</a>
<a href="#search" title="Search">🔍️</a>
<a href="#all" title="All Articles">📙</a>
<a href="#legal" title="Website Terms and Privacy">⚖️</a>
    <a href="https://github.com/acodrst/orng.org"><svg width="34" height="32" viewBox="0 0 34 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M17.2617 0C8.25666 0 0.97699 7.33333 0.97699 16.4057C0.97699 23.6577 5.64132 29.7963 12.112 31.969C12.921 32.1323 13.2173 31.616 13.2173 31.1817C13.2173 30.8013 13.1907 29.4977 13.1907 28.1393C8.66066 29.1173 7.71732 26.1837 7.71732 26.1837C6.98932 24.2823 5.91066 23.7937 5.91066 23.7937C4.42799 22.7887 6.01866 22.7887 6.01866 22.7887C7.66332 22.8973 8.52632 24.4727 8.52632 24.4727C9.98199 26.9713 12.3277 26.2653 13.2713 25.8307C13.406 24.7713 13.8377 24.038 14.296 23.6307C10.683 23.2503 6.88166 21.838 6.88166 15.5363C6.88166 13.7437 7.52832 12.277 8.55299 11.1363C8.39132 10.729 7.82499 9.04467 8.71499 6.79033C8.71499 6.79033 10.09 6.35567 13.1903 8.47433C14.5177 8.11522 15.8866 7.93254 17.2617 7.931C18.6367 7.931 20.0383 8.12133 21.3327 8.47433C24.4333 6.35567 25.8083 6.79033 25.8083 6.79033C26.6983 9.04467 26.1317 10.729 25.97 11.1363C27.0217 12.277 27.6417 13.7437 27.6417 15.5363C27.6417 21.838 23.8403 23.223 20.2003 23.6307C20.7937 24.1467 21.3057 25.1243 21.3057 26.6727C21.3057 28.8727 21.279 30.6383 21.279 31.1813C21.279 31.616 21.5757 32.1323 22.3843 31.9693C28.855 29.796 33.5193 23.6577 33.5193 16.4057C33.546 7.33333 26.2397 0 17.2617 0Z" fill="grey"/>
    </svg></a> 
<a href="#help" title="Help">❓️</a>
</div>`;
pg = "⏳";
for (const i of all_arts.slice(0, 6)) {
  pg += `<div class="lines"><div class="dt">${i[0]}</div>:${
    gf_nav(gf(i[1]))
  }<a href="#${i[1]}" title="${vl(site[i[1]][p["has_label"]])} Article">${
    vl(site[i[1]][p["has_label"]])
  }</a></div>`;
}
document.getElementById("bydate").innerHTML = pg;
const fav_id = vl(site[r][p["favorited_with"]]);
let fav_pins = `${vl(site[fav_id][p["has_emoji"]])}`;
for (const i in site[fav_id][p["has_instance"]]) {
  fav_pins += `<div class="lines">${gf_nav(gf(i))}<a href="#${i}" title="${
    vl(site[i][p["has_label"]])
  }">${vl(site[i][p["has_label"]])}</a></div>`;
}
document.getElementById("pins").innerHTML = fav_pins;
let tinies = "";
for (const i in site[r][p["has_tinies"]]) {
  tinies += `<a href="${vl(site[i][p["has_link"]])}" title="${
    vl(site[i][p["has_label"]])
  }">${vl(site[i][p["has_emoji"]])}</a> `;
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
  return `<a href="#${n.first}">🤛</a> &nbsp; <a href="#${n.prev}">👈️</a> &nbsp; <a href="#${n.next}">👉️</a> &nbsp; <a href="#${n.last}">🤜</a>`;
}
function all() {
  hide_other("dyno_page");
  let l = 0;
  pg = "<h2>All Articles:</h2>";
  for (const i of all_arts) {
    pg += `<div class="lines"><div class="dt">${i[0]}</div>:${
      gf_nav(gf(i[1]))
    }<a href="#${i[1]}">${vl(site[i[1]][p["has_label"]])}</a></div>`;
    l += vl(site[i[1]][p["has_contents"]]).length;
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
  if (site[art]?.[p["has_tag"]]) {
    for (const i in site[art][p["has_tag"]]) {
      pg_tags += `<a href="#${i}">#${vl(site[i][p["has_label"]])}</a> `;
    }
    for (const t in site[art][p["has_tag"]]) {
      let cur_tag = t;
      for (const j in site[t][p["tagged_in"]]) {
        if (j != art) {
          if (cur_tag != "") {
            pgin += `<p><a href="#${t}">#${vl(site[t][p["has_label"]])}</a>`;
            cur_tag = "";
          }
          pgin += `<br> &nbsp; <a href="#${j}">${
            vl(site[j][p["has_label"]])
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
        <b><i>${vl(site[relatives.g][p["has_label"]])} | ${
    vl(site[relatives.f][p["has_label"]])
  }</i></b>
        <div id="art_header">${gf_nav(gf(art))}
          ${vl(site[art][p["has_label"]])}<br>📅 ${vl(site[art][p["has_date"]])}
          &nbsp; 
        </div>
      <div id="navigation" class="nav">${get_nav(art)}</div>
    </div>
    </div>
  <div id="art">${sm(vl(site[art][p["has_contents"]]))}</div>${pg_tags}
  <div id="end_tags"></div><div class="comments">${
    vl(site[art][p["has_comment"]])
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
      (tag_search.length == 3 && site[i[1]]?.[p["has_tag"]]?.[tag_search] ||
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
for (const i in site[tags][p["has_instance"]]) {
  ltags.push(`${
    String(Object.keys(site[i][p["tagged_in"]]).length)
      .padStart(3, "0")
  }-${vl(site[i][p["has_label"]])}-${i}`);
  rtags.push(`${vl(site[i][p["has_label"]])}-${i}`);
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
    ${vl(site[t][p["has_label"]])} &lt;&lt;-- Click to clear.`;
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
  console.log(words);
  const all_sets = [];
  for (const w in words) {
    all_sets.push(new Set());
    for (const i of all_arts) {
      if (vl(site[i[1]][p["has_contents"]]).match(words[w])) {
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
    const artTitle = vl(site[art][p["has_label"]]);
    const artContent = srch[2] != ""
      ? vl(site[art][p["has_contents"]]).replace(words[2], replex).replace(
        words[1],
        replex,
      ).replace(words[0], replex)
      : srch[1] != ""
      ? vl(site[art][p["has_contents"]]).replace(words[1], replex).replace(
        words[0],
        replex,
      )
      : vl(site[art][p["has_contents"]]).replace(words[0], replex);
    const artDate = vl(site[art][p["has_date"]]);
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
  pg = `<h2>${vl(site[nd][p["has_emoji"]])} ${
    vl(site[nd][p["has_label"]])
  }</h2 >`;
  for (const i of all_arts) {
    if (vl(site[i[1]][p["is_instance_of"]]) == nd) {
      pg += `<div class="lines"> <div class="dt">${i[0]}</div>:${
        gf_nav(gf(i[1]))
      } <a href="#${i[1]}">${vl(site[i[1]][p["has_label"]])}</a></div> `;
    }
  }
  document.getElementById("dyno_page").innerHTML = pg;
}
function grandfather(nd) {
  hide_other("dyno_page");
  pg = `<h2>${vl(site[nd][p["has_emoji"]])} ${
    vl(site[nd][p["has_label"]])
  }</h2 >`;
  for (const i in site[nd][p["has_sub"]]) {
    pg += `<div class="lines"><a href="#${i}">${vl(site[i][p["has_emoji"]])}${
      vl(site[i][p["has_label"]])
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
  let pg = `Tags | ${vl(site[nd][p["has_label"]])}`;
  if (nd == "z9b") pg += `${vl(site["vjk"]["c55"])}`;
  for (const i of all_arts) {
    if (i[1] in site[nd][p["tagged_in"]]) {
      pg += `<div class="lines"><div class="dt">${i[0]}</div>:${
        gf_nav(gf(i[1]))
      }<a href="#${i[1]}" title="${vl(site[i[1]][p["has_label"]])} Article">${
        vl(site[i[1]][p["has_label"]])
      }</a></div>`;
    }
  }
  document.getElementById("dyno_page").innerHTML = pg;
}
function refresh() {
  const hash = globalThis.location.hash.substring(1) || "home";
  source_files = document.querySelector('input[name = "f"]:checked').value;
  const lbl = vl(site?.[hash]?.[p?.["has_label"]]);
  gf(hash)
    ? son(hash)
    : site?.[hash]?.[p?.["tagged_in"]]
    ? tag(hash)
    : hash == r
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
    : site?.[hash]?.[p?.["has_sup"]] && site?.[hash]?.[p?.["has_sub"]]
    ? grandfather(hash)
    : site?.[hash]?.[p?.["has_instance"]] && site?.[hash]?.[p?.["has_sup"]]
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
