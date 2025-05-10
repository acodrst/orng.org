const backup = Deno.env.get("CL_ORN_BACKUP");
import { create, web_deal } from "fpng-sign-serve";
const now_text = Deno.readTextFileSync("site_long.txt").trim();
let st = "";
for (const i of now_text.split("\n")) {
  i.slice(0, 12) == '["m1k","wsx"'
    ? st += `["m1k","wsx",${
      JSON.stringify(Deno.readTextFileSync("assets/style.css").trim())
    }],\n`
    : i.slice(0, 12) == '["mn2","wsx"'
    ? st += `["mn2","wsx",${
      JSON.stringify(Deno.readTextFileSync("assets/page.html").trim())
    }],\n`
    : st += `${i}\n`;
}
Deno.writeTextFileSync("site_long.txt", st);
let mod_site=JSON.parse(st)
create(mod_site,backup)
Deno.serve({
  port: 3052,
  hostname: "0.0.0.0",
  handler: (req) => web_deal(req),
});
