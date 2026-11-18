# instagram_monitor custom web dashboard

A Flowbite-style replacement for instagram_monitor's built-in web dashboard, with the same
features: Overview (User/Config views), Targets, Session, Settings, Activity log, follow
analysis, add/remove/start/stop/recheck, browser session import, test email/webhook and
Generate config. It talks only to the tool's own `/api/*` endpoints and loads nothing from the
internet (Tailwind CSS and Heroicons are inlined at build time).

## How it is wired on the router

- File: `/opt/docker/appdata/instagram_monitor/dashboard/index.html` (on `/opt/docker`, so it
  survives OpenWrt sysupgrade).
- `compose.yaml` mounts that folder read-only at `/dashboard`.
- `instagram_monitor.conf` has `WEB_DASHBOARD_TEMPLATE_DIR = "/dashboard"`.
- The tool renders `index.html` with Jinja; only `{{ version }}` is outside `{% raw %}`.

Revert to the built-in dashboard: delete the `WEB_DASHBOARD_TEMPLATE_DIR` line and run
`docker compose up -d` in `/opt/services/instagram_monitor` (the mount can stay).

## Build

    npm install
    npm run build        # -> dist/index.html

Sources: `src/index.html` (markup and JavaScript), `src/input.css` (component classes),
`tailwind.config.cjs`, `build.mjs`. Versions are pinned in `package.json`.

## Deploy

    ssh root@nanopi 'cat > /opt/docker/appdata/instagram_monitor/dashboard/index.html' < dist/index.html

Flask caches the template, so restart afterwards with `docker compose restart instagram_monitor`
in `/opt/services/instagram_monitor` (this also runs one monitoring check).

## After an instagram_monitor update

The dashboard depends on the tool's `/api/*` endpoints, which are not a documented interface.
Diff the new upstream template against `reference/upstream-index-v4.2.html` (look at the
`fetch(` calls, request payloads and response fields used) and port any change, then update
the reference copy. If the new version breaks the page, revert as above until it is fixed.
