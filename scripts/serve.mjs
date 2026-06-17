// Arranca Next liberando primero el puerto, para que `npm start` / `npm run dev`
// nunca truenen con EADDRINUSE si quedó un servidor previo corriendo.
// Uso: node scripts/serve.mjs <start|dev>   (PORT opcional, por defecto 3100)
import { execSync, spawn } from "node:child_process"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const mode = process.argv[2] === "dev" ? "dev" : "start"
const port = Number(process.env.PORT) || 3100

function pidsOnPort(p) {
  const pids = new Set()
  try {
    if (process.platform === "win32") {
      const out = execSync("netstat -ano -p tcp", { encoding: "utf8" })
      for (const line of out.split(/\r?\n/)) {
        const cols = line.trim().split(/\s+/)
        // cols = [TCP, local, foreign, ESTADO, PID]
        if (cols.length >= 5 && cols[3] === "LISTENING" && cols[1].endsWith(":" + p)) {
          pids.add(cols[4])
        }
      }
    } else {
      const out = execSync(`lsof -ti tcp:${p} -sTCP:LISTEN`, { encoding: "utf8" })
      for (const pid of out.split(/\s+/)) if (pid) pids.add(pid)
    }
  } catch {
    // sin coincidencias o herramienta ausente: nada que liberar
  }
  return [...pids].filter((pid) => pid && pid !== "0" && Number(pid) !== process.pid)
}

function freePort(p) {
  for (const pid of pidsOnPort(p)) {
    try {
      if (process.platform === "win32") execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore" })
      else process.kill(Number(pid), "SIGKILL")
      console.log(`[serve] puerto ${p} liberado (se cerró el proceso ${pid})`)
    } catch {
      /* ya no existía */
    }
  }
}

freePort(port)
// pequeño respiro para que el SO suelte el socket antes de re-enlazar
await new Promise((r) => setTimeout(r, 400))

const nextBin = require.resolve("next/dist/bin/next")
const child = spawn(process.execPath, [nextBin, mode, "-p", String(port)], { stdio: "inherit" })

const forward = (sig) => () => {
  try {
    child.kill(sig)
  } catch {
    /* ignore */
  }
}
process.on("SIGINT", forward("SIGINT"))
process.on("SIGTERM", forward("SIGTERM"))
child.on("exit", (code) => process.exit(code ?? 0))
