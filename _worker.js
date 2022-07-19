// const import_node_fs10 = require("node:fs")

const staticAssets = ['.ico', '.js']

const redirect = ({ pathname, href }) => {
    if (pathname === '/' || !pathname.endsWith('/')) return null
    return Response.redirect(href.slice(0, -1), 301)
}

const normalize = (path) => {
    if (path === '/') path = '/index'
    if (path.endsWith('/')) return path
    return `${path}/`
}

export default {
    async fetch(req, env, _ctx) {
        const request = new Request(decodeURIComponent(req.url), req)
        console.log('url =', request.url)
        // console.log(import_node_fs10.Dir)
        const location = new URL(request.url)
        const { origin, host, pathname } = location
        console.log('host =', host)
        console.log('pathname =', pathname)
        const isStaticAsset = staticAssets.some(name => pathname.endsWith(name))
        const assetPath = `${origin}/${env.ASSETS_DIRECTORY}${pathname}`
        // console.log(env.ASSETS.fetch.toString())
        if (isStaticAsset) return env.ASSETS.fetch(assetPath)
        if (redirect(location)) return redirect(location)
        // const space = null
        // const space = '5dd1b315-a596-4ddf-b8e9-1ff93799f6f0'
        const before = new Date().getTime()
        const space = await env.SPACES.get(host)
        const after = new Date().getTime()
        console.log('difference =', after - before)
        console.log('space =', space)
        if (!space) return new Response(null, { status: 404 })
        const cache = caches.default
        const cacheKey = `${origin}/${space}${normalize(pathname)}`
        console.log('cacheKey =', cacheKey)
        const cachedResponse = await cache.match(cacheKey)
        console.log('cachedResponse =', !!cachedResponse)
        if (cachedResponse) return cachedResponse
        const html = await fetch(`${env.NEXT_SERVER_ENDPOINT}/api/revalidate?path=${pathname}&space=${space}`).then(res => res.text())
        const response = new Response(html, { status: 200, headers: { 'Content-Type': 'text/html' } })
        response.headers.set('FC-Space', space)
        response.headers.append('Cache-Control', `max-age=${env.PAGE_REVALIDATE_TIME}`)
        await cache.put(cacheKey, response.clone())
        return response
    }
}
