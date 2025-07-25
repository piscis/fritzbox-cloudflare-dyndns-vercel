export default defineEventHandler(async (event) => {
  removeResponseHeader(event, 'X-Powered-By')
  removeResponseHeader(event, 'x-powered-by')
})
