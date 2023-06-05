# Fritz!Box Cloudflare DynDNS Updater via Vercel

This is a DynDNS Service that can be used to update the IP address of a Fritz!Box to a Cloudflare DNS record.

## Development

### Prerequisites 


- NodeJS 18+
- PNPM
- Configure TakeOver Mode for VS Code (see below)

### Setup

Make sure to install the dependencies:

```bash
# pnpm
pnpm install
```

### Development Server

Start the development server on `http://localhost:3000`

```bash
pnpm dev
```

### Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.


### Customizations

- Configure "take over" mode for volar in VS code: https://vuejs.org/guide/typescript/overview.html#volar-takeover-mode
- Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.
