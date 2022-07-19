// const import_node_fs10 = require("node:fs")

const staticAssets = ['.ico', '.js']

const redirect = ({ pathname, href }) => {
    if (pathname === '/' || !pathname.endsWith('/')) return null
    return Response.redirect(href.slice(0, -1), 301)
}

const getCacheKey = (path) => path.endsWith('/') ? path : `${path}/`

export default {
    async fetch(req, env, _ctx) {
        const request = new Request(decodeURIComponent(req.url), req)
        console.log('url =', request.url)
        const location = new URL(request.url)
        const { origin, host, pathname } = location
        const isStaticAsset = staticAssets.some(name => pathname.endsWith(name))
        const assetPath = `${origin}/${env.ASSETS_DIRECTORY}${pathname}`
        if (isStaticAsset) return env.ASSETS.fetch(assetPath)
        if (redirect(location)) return redirect(location)
        const before = new Date().getTime()
        const space = await env.SPACES.get(host) || '5dd1b315-a596-4ddf-b8e9-1ff93799f6f0'
        const after = new Date().getTime()
        console.log('difference =', after - before)
        if (!space) return new Response(null, { status: 404 })
        const cache = caches.default
        const slug = `/${space}${pathname}`
        const cacheKey = getCacheKey(`${origin}${slug}`)
        const cachedResponse = await cache.match(cacheKey)
        if (cachedResponse) return cachedResponse
        const html = await fetch(`${env.NEXT_SERVER_ENDPOINT}${slug}`).then(res => res.text())
        const response = new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } })
        response.headers.set('FC-Space', space)
        response.headers.append('Cache-Control', `max-age=${env.PAGE_REVALIDATE_TIME}`)
        await cache.put(cacheKey, response.clone())
        return response
    }
}
