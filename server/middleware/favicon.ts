export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)

  if (url.pathname.startsWith('/favicon.ico')) {
    return sendRedirect(event, '/favicons/favicon.svg', 302)
  }
})
