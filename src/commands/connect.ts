import * as p from "@clack/prompts";
import path from "node:path";
import { connectCatalog } from "../core/registry.js";

export async function runConnect(rootArg: string, cwd: string): Promise<void> {
  const root = path.resolve(cwd);
  let url = rootArg.trim();
  if (!url) {
    if (!process.stdin.isTTY) throw new Error("Pass a catalog URL in non-interactive mode: setup connect https://example.com/catalog.json");
    const answer = await p.text({
      message: "Read-only community catalog URL",
      placeholder: "https://example.com/frontend-setup/catalog.json",
      validate(value) {
        if (value === undefined || !value.trim()) return "Enter a catalog URL.";
        try {
          const parsed = new URL(value);
          const localHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
          if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && localHost)) return "Use HTTPS (HTTP is only allowed for localhost development).";
          if (parsed.username || parsed.password) return "Do not embed credentials in the URL.";
        } catch { return "Enter a valid absolute URL."; }
        return undefined;
      }
    });
    if (p.isCancel(answer)) { p.cancel("Connection setup cancelled."); return; }
    url = answer;
  }

  await connectCatalog(root, url);
  p.log.success("Catalog URL saved to frontend-architecture.config.json.");
  p.log.message("The CLI will only send a read-only GET request when you run `setup sync`. It will not upload project files or metadata.");
  p.outro("Connection configured. Run `setup sync` to download and validate the JSON catalog.");
}
