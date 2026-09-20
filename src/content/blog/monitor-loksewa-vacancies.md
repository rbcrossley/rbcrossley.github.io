---
title: How to get regular updates of Loksewa vacancies, exam dates, and results
description: Never miss any Loksewa Computer Engineer and IT officer vacancy. Deploy a self-hosted loksewa computer engineering and IT officer exams, results, and vacancies monitoring system.
date: 2026-09-15
author: BerojgarEngineer
image: /images/blog/monitor.jpg
tags: ["Loksewa", "changedetection.io", "Docker", "Docker Compose", "Rocky Linux", "self-hosting", "website change monitoring", "XPath filter", "vacancy alerts", "PSC notices", "Playwright", "notification setup"]
categories: ["loksewa", "devops"]
---

If you are preparing for Loksewa, you already know the problem. The notice you needed was published on a Sunday, you opened the site on Wednesday, and by then half the application window is gone. Refreshing psc.gov.np five times a day is not a strategy.

So instead of checking the site, let the site check itself and mail you when something changes. This post sets up a self-hosted [changedetection.io](https://changedetection.io) instance on Rocky Linux 10, points it at the three PSC pages that actually matter, and tunes the filters so you only get pinged for real notices - not for every visitor counter and rotating banner on the page.

## 1. Prep the system

```bash
sudo dnf -y update
sudo dnf -y install dnf-plugins-core kernel-modules-extra
sudo reboot
```

`kernel-modules-extra` is the one that catches people out. Rocky Linux 10 minimal and cloud images don't include it by default, and without it Docker fails to start because iptables can't load the `xt_addrtype` module. Reboot so the running kernel matches the modules you just installed. After reboot, confirm:

```bash
modinfo xt_addrtype
```

## 2. Install Docker CE

Rocky 10 ships DNF 5, where the `config-manager` syntax changed. The bulletproof version that works either way:

```bash
sudo curl -fsSL -o /etc/yum.repos.d/docker-ce.repo \
  https://download.docker.com/linux/rhel/docker-ce.repo
```

Note the `/rhel/` path. A lot of guides still tell you to use the CentOS repo - that was a workaround from when Docker v28 had no RHEL 10 repository, and it's no longer needed.

```bash
sudo dnf -y install docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
docker version
```

## 3. Post-install

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Firewall for LAN access:

```bash
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --permanent --add-port=9443/tcp
sudo firewall-cmd --reload
```

## 4. Deploy changedetection + Chrome

```bash
mkdir -p ~/changedetection && cd ~/changedetection
```

Create the compose file, substituting your LAN IP in `BASE_URL`:

```bash
cat > docker-compose.yml << 'EOF'
services:
  changedetection:
    image: ghcr.io/dgtlmoon/changedetection.io:latest
    container_name: changedetection
    hostname: changedetection
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - changedetection-data:/datastore
    environment:
      - PLAYWRIGHT_DRIVER_URL=ws://sockpuppetbrowser:3000
      - BASE_URL=http://192.168.1.100:5000
      - TZ=Asia/Kathmandu
      - FETCH_WORKERS=4
    depends_on:
      sockpuppetbrowser:
        condition: service_started

  sockpuppetbrowser:
    image: dgtlmoon/sockpuppetbrowser:latest
    container_name: sockpuppetbrowser
    hostname: sockpuppetbrowser
    restart: unless-stopped
    cap_add:
      - SYS_ADMIN
    environment:
      - SCREEN_WIDTH=1920
      - SCREEN_HEIGHT=1024
      - SCREEN_DEPTH=16
      - MAX_CONCURRENT_CHROME_PROCESSES=4

volumes:
  changedetection-data:
EOF
```

Three deliberate choices in there:

- **sockpuppetbrowser has no published ports.** Plenty of example compose files map `3000` or `5041` to the host. It doesn't need to be - changedetection reaches it over the internal compose network by hostname. Exposing a remote-controllable Chrome on your LAN is a bad idea.
- **`cap_add: SYS_ADMIN`** is required for Chrome's sandbox to work.
- **`BASE_URL`** is what gets embedded in notification links. Get it wrong and your alert emails will point at `localhost`.

Bring it up:

```bash
docker compose up -d
docker compose ps
docker compose logs -f changedetection
```

## 5. Turn the Chrome fetcher on

This is the step that trips up almost everyone, and it's why you'll find threads full of people whose Playwright setup "doesn't work." Setting `PLAYWRIGHT_DRIVER_URL` only makes the fetcher *available* - it doesn't make it the default.

Open `http://<LAN-IP>:5000`, then:

- **Settings → Fetching** → set the default fetcher to the Chrome/Playwright option
- Or set it per-watch under the watch's **Request** tab

## 6. The three PSC pages worth watching

Lok Sewa Aayog publishes different things on different category pages, and the one most people bookmark (the homepage) is the noisiest of the lot. For Computer Engineer and IT Officer aspirants applying through the **sangathit** (organised institutions - banks, NEA, NTC, and similar corporations) route, these three are the ones that matter:

| What you get | URL |
|---|---|
| New vacancy announcements | `https://psc.gov.np/category/sangathit-vacancies` |
| Exam dates, centres, schedules | `https://psc.gov.np/category/sangathit-examinations` |
| Published results | `https://psc.gov.np/category/sangathit-results` |

Add each one separately. From the changedetection dashboard, paste the URL into the **Add a new change detection watch** box and hit **Watch**. Do it three times, once per URL.

Give each watch a sensible title and tag while you're at it - open the watch, go to the **General** tab, and set:

- **Title**: `PSC - Sangathit Vacancies` (and so on for the other two)
- **Group / tag**: `loksewa` - later you can filter the dashboard by this tag and, more usefully, attach one notification setting to the whole group instead of repeating it three times
- **Recheck time**: every **3 hours** is plenty. PSC publishes during office hours, and hammering a government site every 60 seconds is both rude and a good way to get your IP throttled.

While you're in the watch settings, confirm the **Request** tab is using the Chrome/Playwright fetcher. These pages render their notice tables through the theme's JavaScript, and the plain HTTP fetcher gives you an inconsistent snapshot.

## 7. Filters: the one XPath that makes this usable

Here is what happens if you watch those URLs raw: you get a notification almost every single check. Not because a new notice was published, but because the page footer has a visitor counter, the sidebar has a rotating notice widget, and the nav has a Nepali date that changes daily. Signal drowns in noise, and within a week you start ignoring the mails - which defeats the entire purpose.

The fix is to tell changedetection to look at *only* the notice table. Open the watch → **Filters & Triggers** tab → the **CSS/JSONPath/JQ/XPath Filters** box, and put in:

```
//table//tbody/tr[position() <= 10]
```

Read it left to right:

- `//table`: find the table anywhere in the document, no matter how deeply the theme nests it in divs. This is why XPath beats a brittle CSS selector like `div.content > div.row > table` here; if PSC reshuffles its layout, `//table` survives it.
- `//tbody/tr`: take the body rows only. The `<thead>` row is skipped, so a header re-render never counts as a change.
- `[position() <= 10]`: and keep only the **first ten** rows.

That last bracket is the important part, and it's doing two jobs.

First, **it kills pagination noise.** These category pages list dozens of old notices. Every time PSC adds one entry at the top, every row below shifts down a position, and an unfiltered diff reports the whole table as changed. By pinning the window to the top ten, a new notice pushes exactly one row off the bottom and the diff stays small and readable - you can see the actual new notice in the mail body instead of a wall of red and green.

Second, **it keeps you looking at the newest entries only.** PSC sorts newest first. Anything older than the top ten is not something you need an alert about; you either already applied or the deadline is gone.

Ten is a starting point, not a law. If a heavy publishing week means several notices land between two checks, bump it to `position() <= 15`. If you want to be alerted only for the single newest item, `position() = 1` works too - just be aware that if two notices land inside one recheck interval, you'll only ever see the later one.

Apply the same filter to all three watches. The vacancies, examinations, and results pages share the same table layout, so the same XPath works unchanged on all of them.


### Wiring up notifications

Go to **Settings → Notifications** for a global default, or set it per-watch (or per-tag, which is why we tagged them `loksewa`) in the **Notifications** tab.

changedetection uses [Apprise](https://github.com/caronc/apprise) URLs, so the format is one line per destination:

```
tgram://<bot-token>/<chat-id>
discord://<webhook_id>/<webhook_token>
```
Telegram is honestly the better choice here - mail from a self-hosted box tends to land in spam, and a Telegram ping actually reaches your phone.

Set Notification Body.

```
{{watch_title}} changed

{{watch_url}}

{{diff}}
```

`{{diff}}` inlines the added and removed lines, which - thanks to the `position() <= 10` filter - is usually just the one new row. That means you can read the notice title straight off your phone's lock screen and decide whether to open the laptop.

Use **Send test notification** before you walk away. A silent notification pipeline is worse than no pipeline, because you'll assume no mail means no vacancy.

### Final check

Open one of the watches and hit **Recheck**. Then let it run a full day. What you want to see by the next morning is: three watches, all green, all with a "last checked" timestamp, and zero notifications. That's the system working. The first mail you get should be a real notice.

Updating later:

```bash
cd ~/changedetection
docker compose pull && docker compose up -d
```

One thing to watch: `docker compose down` leaves the named volume intact, but `docker compose down -v` destroys your entire watch history and config. Easy to type by reflex.
