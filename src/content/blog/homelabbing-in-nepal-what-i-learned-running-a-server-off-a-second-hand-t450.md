---
title: "Homelabbing in Nepal: What I Learned Running a Server Off a Second-Hand T450"
description: Learn how I built a budget homelab in Nepal using a second-hand
  ThinkPad T450, Proxmox, Docker, and Ethernet, including costs, power use,
  hardware lessons, and real projects.
date: 2026-09-16
image: /images/blog/budget-homelab.jpg
author: raju
categories:
  - linux
  - devops
tags:
  - homelab
  - homelabbing in Nepal
  - Proxmox VE
  - ThinkPad T450
  - home server
  - Linux server
  - Docker
  - Kubernetes
  - self-hosting
  - DevOps Nepal
draft: false
---
If you've been in the Nepali IT/DevOps space for a while, you've probably thought about running your own homelab at some point. Cloud is expensive, AWS free tier runs out fast, and honestly, there's no better way to actually *learn* Kubernetes, Docker, or Linux server administration than breaking things on your own hardware.

Here's my experience setting one up in Kathmandu, on a budget, with second-hand gear.

## The Hardware: A ThinkPad T450 for 14,000 NPR

I bought a ThinkPad T450 from a seller on Hamrobazaar for **14,000 NPR**. It has 12GB of DDR3 RAM and 4 vCPUs (2 cores / 4 threads). Not powerful by any means, but it was the most affordable device I could find at the time.

I'll be honest: I somewhat regretted the purchase. The laptop's screen has a visible line running through the middle of the display. It's usable, but it's not something you'd want to stare at all day. That said, for a homelab, the monitor barely matters: I'm not running a desktop environment on it or looking at its screen day to day. It sits headless doing server work.

## From VirtualBox to Proxmox

I started out running VMs on VirtualBox, mostly because it was the easy, familiar option. But VirtualBox is a type-2 hypervisor, meaning you're running a full host OS underneath it just to host your VMs. That's wasted overhead on a machine with only 12GB of RAM to begin with.

Switching to **Proxmox VE** made a lot more sense. Proxmox is a bare-metal (type-1) hypervisor. It installs directly on the hardware and becomes the host OS itself. It helps to properly squeeze the RAM for the virtual machines which is what I want. I do not want windows 10 host OS taking 4GB RAM and 2 threads of CPU.

I manage proxmox through the web-ui. So I do not need to stare the screen. That is really helpful because the screen of that laptop is worst.

## The Ethernet Requirement Nobody Warns You About

Here's something that can be a dealbreaker for a lot of people trying this at home: **Proxmox essentially requires a wired Ethernet connection** to work properly and reliably.

For a lot of us in Kathmandu, that's a real problem. Your router is in one room, your setup is in another, and drilling holes and running Ethernet cable through walls isn't always practical.

My workaround was simple: I bought a small Ethernet cable and just keep the T450 in the same room as my router.


## Not 24x7

Unlike a "real" homelab setup you'd see in tutorials from the US or Europe, mine doesn't stay on all the time. I don't run it 24x7.

This is a very deliberate choice, and it comes down to something people outside developing countries don't usually have to think about: **electricity cost**. Keeping a server running around the clock adds up on the power bill in a way that's hard to justify for a hobby project. So I power it on when I need it (for a project, to watch a specific deployment, or when changedetection.io needs to catch something) and shut it down when I don't.

## Ideas

Out of everything I've run on this box (and I've experimented with a fair number of tools), the single most useful deployment has been **[changedetection.io](https://changedetection.io/)**, running in Docker.

I use it to monitor Public Service Commission (PSC) and corporation vacancy pages for Loksewa IT vacancy updates. Missing a vacancy notice is one of the most common, and most painful, mistakes Loksewa aspirants make in Nepal, since notices go up quietly and don't always get shared widely before deadlines approach.

I actually wrote a full walkthrough of that exact setup (Docker, XPath filters, and all) over on the blog. Check it out here: https://berojgarengineer.com/blog/monitor-loksewa-vacancies/

## Second-Hand Hardware in Nepal

If you're thinking about doing something similar, I want to be blunt about the second-hand hardware market here, especially on Hamrobazaar or Facebook Marketplace: **it's cooked.**

A huge chunk of the listings that look like individual sellers posting their old laptop are not actually individuals at all. They're businesses (resellers) spamming the same ads over and over, sometimes reposting the same listing repeatedly, sometimes running what are effectively storefronts disguised as personal sales. You'll see the same "seller" with dozens of "personal" laptops for sale, which tells you everything.

My honest recommendation: **I would not recommend buying second-hand hardware in Kathmandu, at least not through Hamrobazaar or Facebook marketplace, unless you really know what you're doing**: 

That said, even with the regret, the T450 has been a genuinely useful learning tool. It was the only machine I could have afforded at that time.

## Should You Build a Homelab in Nepal?

If you have old unused hardware, then it is a no-brainer.

Otherwise also, I recommend homelabbing. Hardware(RAM, GPU and Drives) is getting really expensive. So, this hobby has become very expensive. If you can afford it, then go for it. It is fun and you learn a lot. But have a goal in mind before you build a homelab.
