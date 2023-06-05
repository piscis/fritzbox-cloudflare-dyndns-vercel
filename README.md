# Fritz!Box Cloudflare DynDNS Updater via Vercel

This is a DynDNS Service that can be used to update the IP address of a Fritz!Box to a Cloudflare DNS record.

## Development

### Prerequisites for Development

- NodeJS 18+
- PNPM
- Configure TakeOver Mode for VS Code (see below)

### Setup

Make sure to install the dependencies:

```bash
# Install dependencies via pnpm
pnpm install
```

### Development Server

Start the development server on `http://localhost:3000`

```bash
# Run development server
pnpm dev
```

### Production

Build the application for production:

```bash
# Run production build
pnpm build
```

Locally preview production build:

```bash
# Run production build locally
pnpm preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

### Sources

  - Configure "take over" mode for volar in VS code: https://vuejs.org/guide/typescript/overview.html#volar-takeover-mode
  - Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

----

## Setup Service and configure Fritz!Box

### Create a Cloudflare API token

Create a [Cloudflare API token](https://dash.cloudflare.com/profile/api-tokens) with **read permissions** for the scope `Zone.Zone` and **edit permissions** for the scope `Zone.DNS`.

![Create a Cloudflare custom token](./docs/images/docs-create-cloudflare-token.png "Create a Cloudflare custom token")

### :rocket: Option 1: Self-host on Vercel

Deploy this project to your Vercel account and use it as a service for your FRITZ!Box.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpiscis%2Ffritzbox-cloudflare-dyndns-vercel&project-name=fritzbox-cloudflare-dyndns-vercel&repository-name=fritzbox-cloudflare-dyndns-vercel)

### :cloud: Option 2: Use my vercel cloud service for free

If you don't want to host "fritzbox cloudflare dyndns" yourself, feel free to use my cloud service. Just use this Update URL in your FRITZ!Box:

```
https://fritzdns.vico.li/api/fritz-dyndns/?token=<pass>&record=fritz.example.com&zone=example.com&ipv4=<ipaddr>&ipv6=<ip6addr>
```

### Configure your FRITZ!Box DynDNS Settings

![Configure DynDNS settings](./docs/images/docs-fritzbox-dyndns.png "Configure DynDNS settings in your FRITZ!Box Admin interface")

| FRITZ!Box Setting | Value                                                                                                                            | Description                                                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Update URL        | `https://fritzdns.vico.li/api/fritz-dyndns/?token=<pass>&record=fritz.example.com&zone=example.com&ipv4=<ipaddr>&ipv6=<ip6addr>` | Replace the URL parameter `record` and `zone` with your domain name. If required you can omit either the `ipv4` or `ipv6` URL parameter. |
| Domain Name       | fritz.example.com                                                                                                                | The FQDN from the URL parameter `record` and `zone`.                                                                                     |
| Username          | admin                                                                                                                            | You can choose whatever value you want.                                                                                                  |
| Password          | ●●●●●●                                                                                                                           | The API token you’ve created earlier.                                                                                                    |


## Credits

Original port for Vercel from: https://github.com/L480/cloudflare-dyndns
