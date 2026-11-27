# CI checks every PR and deploys a separate Worker per stage

- **Checks**: the `pull_request` trigger has no branch filter. A stacked PR targets its
  predecessor, not `main`, and would otherwise get no checks until it is retargeted.
- **Stages**: a push to `main` deploys Staging and a push to `released` deploys
  Production. Each GitHub Environment holds its own scoped `PHASE_SERVICE_TOKEN`, and
  each Phase environment holds its own `CF_WORKER_NAME` and `CF_ROUTE_PATTERN`, so the
  stages are separate Workers and Staging cannot overwrite Production. Phase environment
  names are capitalised and GitHub's are not, so `setup-stage` emits both.
- **Phase host**: `PHASE_HOST` is mapped at job level, because job containers do not
  inherit the runner's environment. An empty value silently falls back to Phase's cloud
  host, which fails as an auth error far from its cause. So a step checks both variables
  up front, and it never echoes the host: this repository is public, and a value from
  `vars` is not masked.
- **Chromium**: the cache key is the `playwright-core` version, because each release pins
  its own Chromium build. The cache holds the browser but not its apt packages, so a cache
  hit still runs `install-deps`. Only the headless shell is installed.
- **Workflow-run cleanup** uses `Mattraks/delete-workflow-runs`: the original
  `GitRML/delete-workflow-runs` is archived and its scheduled run failed.
