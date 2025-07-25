# Changelog

## [2.2.0](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/2.1.0...2.2.0) (2025-07-25)

### Features

* enable CF loging by default since tokens will be redacted from log stream ([d4ae74e](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/d4ae74eed2543b16ed4a899face796d9fd7957fa))
* Enable cloudflare logging via deployment config ([7a2d79f](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/7a2d79f0e654984fb7d64e0f526125441ea43acc))

## [2.1.0](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/2.0.0...2.1.0) (2025-07-25)

### Features

* implements noCacheHeaders middleware ([97b457f](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/97b457f062764d1085906f397494896349a874ca))

### Bug Fixes

* adds workaround for nixpacks deployment ([77b42c5](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/77b42c5e8d871b55de78d2ab641a7ea72130b5cf))
* fix deprecation warning for nativeEnum ([d150936](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/d150936b97089bab49b3a09138469357b7386486))

## [2.0.0](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.5.0...2.0.0) (2025-07-25)

### Features

* add cloudflare build and deployment steps ([44ff19d](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/44ff19d93882a56ef4a0c5212dcc6f5d57fbe59d))
* add nuxt icon collections config ([9fd7003](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/9fd70030556625c9a8acd484bffda565b66e2747))
* add updated version for x-powered-by middleware ([965d166](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/965d16626d23426fc67715d4287c5ef1da97f182))
* adds cloudflare deployment config ([cf070e3](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/cf070e3d1a493522921af6af12500ba4310f4a8b))
* adds implementation via orpc ([dfda9b8](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/dfda9b86b9421001b9f3700c990d5a10b4477157))
* adds logger utility ([bcb8ce9](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/bcb8ce9d25446ada190fe92a44bf92f96e936fa9))
* adds middleware to handle favicon requests ([11d60f0](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/11d60f071049133b1d647f57a47a3ca78f4d0136))
* adds middleware to remove xpowerdby header ([fb8e9de](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/fb8e9deba1f50cf5dd874cbf74d0628f5502fbfa))
* adds nuxt icon config ([bcc3166](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/bcc3166804f93c131367dbcc5d56e66e3d2db9d7))
* bump tailwind unocss integration to tailwind4 ([beacacf](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/beacacf59694f3f62164207ec99bb43436d1b612))
* cleanup readme ([abba704](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/abba704befe17388fd793f4e9a1a80905e49167a))
* cleanup vscode settings ([7a40702](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/7a407023f8b54875ff461ba928c7e13987b60dae))
* configure nuxt + eslint ([315c341](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/315c3412019ffeda33e57e7c4068e8cf3c72341c))
* convert app to nuxt4 ([4c85d3c](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/4c85d3c6c5ef14c823fa083b780008220f85b39f))
* enable nuxt test utils ([f80ecb0](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/f80ecb02136c088246f0814c7be5c1d9325d6461))
* enable server source maps ([6edcc6e](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/6edcc6e3bfeb9221b18fe08b951efdfb9d1ca0d8))
* ignore build directories ([554b393](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/554b3931f46649dc3aafdac17af8d98e7f526eca))
* integrate with nuxt eslint ([6eeb6dc](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/6eeb6dcb937873df00f5e872721058cadb98dc5d))
* modernize nuxt config ([b903639](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/b903639d310b59cfa3a4aeedf8ecf8575a14d8d4))
* use nuxt icon integration ([a9ce909](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/a9ce909553cab8ebe0b1692b243f64191ffc83ea))

### Bug Fixes

* **deps:** add additonal test utils ([6a221f7](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/6a221f773f5678e2dc036e953b2af1bbb21b2cb4))
* **deps:** Approve pnpm builds ([11d3e38](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/11d3e389fa840c3814cc7b7e92b387ed5f49e6bf))
* **deps:** bump packages ([00d130e](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/00d130e0037a962afa48b011286e658b53184d8d))
* fix lisense attribute ([8b48ff9](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/8b48ff98e734a21e3217b9c145cb077ca2b654a4))
* fixes linter integration ([a062c3e](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/a062c3e9e85c1716182bd4da504999ec0207efcb))
* fixes typescript errors and tests ([8833010](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/883301002d888ad05279dcf9a284726edbf9c4be))
* use NuxtLayout to wrapp pages ([b13948f](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/b13948f7565a355c5379ecc4ac4b7d815e6471da))

## [1.5.0](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.4.2...1.5.0) (2024-09-18)


### Features

* simplify github workflow ([e80e106](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/e80e10687951c8a29b49947c5c18d66b2ef013b1))


### Bug Fixes

* fixes linter issue ([5f29fca](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/5f29fcacd8a134b49816daf1cfc108359dc0521a))

## [1.4.2](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.4.1...1.4.2) (2024-06-03)

## [1.4.1](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.4.0...1.4.1) (2024-06-03)


### Bug Fixes

* downgrade cloudflare to 2.9.1 ([3d20423](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/3d20423781cefdb9cf3db8071985b95976891d5a))

## [1.4.0](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.3.2...1.4.0) (2024-06-01)


### Features

* adds startup script ([9986a73](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/9986a7313728830ab061eef8b68ae7331db647f3))
* adjust linting rules ([70d67a2](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/70d67a2747bf49c07305fa740ccdaef06e50e659))
* bump node version to 20.x ([e360701](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/e360701410af2a904613b639f9b82bc195f24359))


### Bug Fixes

* fixes formatation issues ([3f866cf](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/3f866cffdb5777c2046ab1ae844ce413c1726840))
* fixes unit tests ([b9455e6](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/b9455e6d558ae41db7c1e00f04fbfb9989083b15))
* remove deprecated option for eslint packageManager ([2fac162](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/2fac162cf78daca5f36a9f6284e1c1adf3ca2be1))
* remove deprecated settings in vscode settings.json ([a88d10c](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/a88d10cbf7bd92b8942e9222fa11c95bd6506599))

## [1.3.2](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.3.1...1.3.2) (2023-10-11)

## [1.3.1](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.3.0...1.3.1) (2023-10-11)

## [1.3.0](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.2.0...1.3.0) (2023-10-11)


### Features

* migrate app to unocss remove tailwind dependencies ([bd41ea6](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/bd41ea61071b441d84e8820c38a669aa4e8e0dc1))


### Bug Fixes

* cleanup uno.config.tss ([51c2ad5](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/51c2ad5ebb631b5baabe88a67e8f667a4061044d))

## [1.2.0](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.1.4...1.2.0) (2023-10-11)


### Features

* limit the amount of time a job can run ([b99a6d9](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/b99a6d9714c70f51d9756bd877f11164c7520d5d))

## [1.1.4](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.1.3...1.1.4) (2023-09-19)


### Bug Fixes

* removes invaled config ([7cef6c9](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/7cef6c981951e45787fcdcb9e9387eff5e0c6392))

## [1.1.3](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.1.2...1.1.3) (2023-09-19)


### Features

* adds additional configs ([e778bc6](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/e778bc66dec39d5bb86f23dfb8728c5bbee9baf6))

## [1.1.2](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.1.1...1.1.2) (2023-09-19)


### Features

* autogenerate release logs ([bf0fdc6](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/bf0fdc602f272503071947a24feab6be0e3143f0))

## [1.1.1](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.1.0...1.1.1) (2023-09-19)


### Features

* adds new release strategy ([c931f57](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/c931f5785739345d8a91220fb228f10d5eae6a51))

## [1.1.0](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.0.4...1.1.0) (2023-09-19)

## [1.0.4](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.0.3...1.0.4) (2023-09-19)

## [1.0.3](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.0.2...1.0.3) (2023-09-19)


### Bug Fixes

* sync script ([ff3abef](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/ff3abefd3abf630fe735777f13ea23728413c6f5))

## [1.0.2](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.0.1...1.0.2) (2023-09-19)


### Bug Fixes

* sync script ([6e0fc78](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/6e0fc78e762782d2096a9a235190bc811d406ffc))

## [1.0.1](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/compare/1.0.0...1.0.1) (2023-09-19)

## 1.0.0 (2023-09-19)


### Features

* prepare version info ([919a350](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/919a350d97d699c348265c7a95d7e75a0f452d48))
* Update wording for service description ([2c63d8d](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/2c63d8dc420d1df24dbd34bfcb9e6fbdaf7e2e43))


### Bug Fixes

* linting issues and make source compatible again after @antfu/eslint-config package update ([fd73830](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/fd7383079a4662bbf6a8fd74ab9aa9900b86e913))
* linting issues in package.json ([abfad4e](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/abfad4e1e5bbb07aa55514fe00ba323d8306306c))
* use correct package name for this repo ([94cee1a](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/commit/94cee1af458b53a8b12d8f867082b0c44c76a98b))
