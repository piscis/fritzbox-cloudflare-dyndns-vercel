export default defineEventHandler((event) => {
  return sendRedirect(event, '/favicons/favicon.svg', 302)
})
