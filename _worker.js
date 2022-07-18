export default {
    async fetch(request, env, _context) {
        // const cache = caches.default
        // await cache.match(request)
        const { host } = new URL(request.url)
        console.log('host =', host)
        console.log('env =', env)
        const response = new Response(request.url)
        response.headers.set('X-Hello', 'Hello from the worker!')
        return response
    }
}
