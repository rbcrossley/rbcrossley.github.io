---
title: "Homelabbing in Nepal: What I Learned Running a Server Off a Second-Hand T450"
description: Learn how I built a budget homelab in Nepal using a second-hand
  ThinkPad T450, Proxmox, Docker, and Ethernet - including costs, power use,
  hardware lessons, and real projects.
date: 2026-09-16
image: /images/blog/budget-homelab.jpg
author: raju
categories:
  - linux
  - devops
tags:
  - homelab homelabbing in Nepal Proxmox Proxmox VE ThinkPad T450 home server
    Linux server Linux homelab DevOps homelab Docker Kubernetes self-hosting
    server administration homelab Nepal DevOps Nepal
draft: false
---
If you've been in the Nepali IT/DevOps space for a while, you've probably thought about running your own homelab at some point. Cloud is expensive, AWS free tier runs out fast, and honestly - there's no better way to actually *learn* Kubernetes, Docker, or Linux server administration than breaking things on your own hardware.

Here's my experience setting one up in Kathmandu, on a budget, with second-hand gear.

## The Hardware: A ThinkPad T450 for 14,000 NPR

I bought a ThinkPad T450 from a seller on Hamrobazaar for **14,000 NPR**. It has 12GB of DDR3 RAM and 4 vCPUs (2 cores / 4 threads) - not powerful by any means, but it was the most affordable device I could find at the time.

I'll be honest: I somewhat regretted the purchase. The laptop's screen has a visible line running through the middle of the display. It's usable, but it's not something you'd want to stare at all day. That said, for a homelab, the monitor barely matters - I'm not running a desktop environment on it or looking at its screen day to day. It sits headless in a corner doing server work, which is honestly the best second life a laptop with a busted screen can have.

## From VirtualBox to Proxmox

I started out running VMs on VirtualBox, mostly because it was the easy, familiar option - install it on top of Windows or a regular desktop OS, spin up VMs, done. But VirtualBox is a type-2 hypervisor, meaning you're running a full host OS underneath it just to host your VMs. That's wasted overhead on a machine with only 12GB of RAM to begin with.

Switching to **Proxmox VE** made a lot more sense. Proxmox is a bare-metal (type-1) hypervisor - it installs directly on the hardware and becomes the host OS itself. No wasted layer underneath. On a machine as modest as the T450, that difference in overhead actually matters. It let me squeeze more usable VMs and containers out of the same 12GB of RAM.

This is also what makes a laptop with a broken screen genuinely useful again - Proxmox is managed entirely through a web UI from another machine. I don't need to look at the T450's screen at all once it's set up.

## The Ethernet Requirement Nobody Warns You About

Here's something that can be a dealbreaker for a lot of people trying this at home: **Proxmox essentially requires a wired Ethernet connection** to work properly and reliably (Wi-Fi networking on Proxmox is possible but painful and unreliable for a host).

For a lot of us in rented rooms or shared apartments in Kathmandu, that's a real problem. Your router is in one room, your setup is in another, and drilling holes and running Ethernet cable through walls isn't always practical - or allowed if you're renting.

My workaround was simple: I bought a small Ethernet cable and just keep the T450 in the same room as my router. No drilling, no wiring through walls, no negotiating with a landlord. If you're starting out and don't want to commit to running cable through your house, this is the easiest fix.

## It's Not Running 24x7 - And That's Intentional

Unlike a "real" homelab setup you'd see in tutorials from the US or Europe, mine doesn't stay on all the time. I don't run it 24x7.

This is a very deliberate choice, and it comes down to something people outside developing countries don't usually have to think about: **electricity cost**. Keeping a server running around the clock adds up on the power bill in a way that's hard to justify for a hobby project when you're budgeting in NPR, not USD. So I power it on when I need it - for a project, to watch a specific deployment, or when changedetection.io needs to catch something - and shut it down when I don't.

It's a trade-off. You lose the "always-on monitoring" ideal that's the whole point of some self-hosted tools. But it's the practical reality of running a homelab in Nepal.

## The Most Useful Thing I've Deployed: changedetection.io

Out of everything I've run on this box - and I've experimented with a fair number of tools - the single most useful deployment has been **[changedetection.io](https://changedetection.io/)**, running in Docker.

I use it to monitor Public Service Commission (PSC) and corporation vacancy pages for Loksewa IT vacancy updates. Missing a vacancy notice is one of the most common - and most painful - mistakes Loksewa aspirants make in Nepal, since notices go up quietly and don't always get shared widely before deadlines approach. changedetection.io watches those pages and flags changes automatically, so I don't have to manually refresh government websites every day.

I actually wrote a full walkthrough of that exact setup - Docker, XPath filters, and all - over on the blog. Check it out here: https://berojgarengineer.com/blog/monitor-loksewa-vacancies/

Of everything running on this little 14,000 NPR laptop, this is the one that's paid for itself many times over in actual usefulness.

## Second-Hand Hardware in Nepal: My Honest Take

If you're thinking about doing something similar, I want to be blunt about the second-hand hardware market here, especially on Hamrobazaar: **it's cooked.**

A huge chunk of the listings that look like individual sellers posting their old laptop are not actually individuals at all. They're businesses - resellers - spamming the same ads over and over, sometimes reposting the same listing repeatedly, sometimes running what are effectively storefronts disguised as personal sales. You'll see the same "seller" with dozens of "personal" laptops for sale, which tells you everything.

My honest recommendation: **I would not recommend buying second-hand hardware in Kathmandu, at least not through Hamrobazaar, unless you really know what you're doing** - you can check serial numbers, test hardware thoroughly before paying, and negotiate from a position of knowing exactly what a fair price looks like. If you can't do that confidently, you're rolling the dice on getting a laptop with hidden problems (like, well, a line down the middle of the screen) at a price that isn't actually the bargain it looks like.

That said - even with the regret, the T450 has been a genuinely useful learning tool. Sometimes "good enough and cheap" beats "perfect and expensive" when the whole point is to break things and learn.

## Should You Build a Homelab in Nepal?

If you're serious about DevOps, Kubernetes, Docker, or just understanding how servers actually work beyond following tutorials - yes, absolutely. But go in with realistic expectations for a developing-country setup:

* **Budget hardware** will have compromises. Buy carefully, test before paying, and don't expect Hamrobazaar listings to be what they claim.
* **Ethernet matters more than you'd think** for Proxmox - plan your physical setup around it, even if that just means keeping your server near your router.
* **24x7 uptime isn't always worth it.** Run your lab when you're using it. Electricity costs are real here.
* **Pick one genuinely useful project** to justify the setup. For me, that was changedetection.io monitoring government vacancy pages - something that solves a real problem I have, not just a tech demo.

A homelab doesn't need to be expensive or always-on to be worth it. Mine cost 14,000 NPR, runs on a laptop with a broken screen, and gets turned off most of the day - and it still does something genuinely useful for my Loksewa prep every single week.
