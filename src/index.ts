import type { Env } from "./types"

export default {
	async fetch(
    request: Request,
    env: Env,
	): Promise<Response> {
    try {
      const url = new URL(request.url)
      if (url.pathname.length == 1) {
        return new Response("Pathname required to get data", {
          status: 404
        })
      }
      const id = env.IPBS.idFromName(url.pathname)
      const obj = env.IPBS.get(id)
      return obj.fetch(request)
    } catch (err: any) {
      return new Response(err.toString())
    }
	},
}

export class IpBasedStorage {
  state: DurableObjectState

  constructor(state: DurableObjectState) {
    this.state = state
  }

  async fetch(request: Request) {
    if (request.method === "POST") {
      const ip = request.headers.get("CF-Connecting-IP") || "1.2.3.4"
      const data = await request.text()
      await this.state.storage.put(ip, data)
      return new Response(ip + " stored " + data)
    }

    if (request.method === "GET") {
      const ip = request.headers.get("CF-Connecting-IP") || "1.2.3.4"
      const data: string | undefined = await this.state.storage.get(ip)
      if (data) {
        return new Response(data)
      } else {
        return new Response("No key found yet for value: try POSTing data", { status: 404 })
      }
    }
  }
}

