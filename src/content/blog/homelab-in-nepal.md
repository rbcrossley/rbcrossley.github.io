---
title: Homelabbing in Nepal
description: Learn how I built a practical homelab in Nepal with limited space and budget, using servers, Linux, networking, Kubernetes, and lessons from support work.
date: 2026-08-31
author: BerojgarEngineer
image: /images/blog/homelab.png
tags: ["homelab", "self-hosting", "home server", "Linux", "Kubernetes", "home networking", "DevOps learning", "Proxmox", "virtualization", "refurbished hardware", "homelab on a budget", "hands-on practice"]
categories: ["linux", "devops"]
---

# whoami

I am a support engineer with more than two and a half years of experience. I mainly work with Linux and Windows servers, as well as Kubernetes.

My goal as a support engineer is to ensure minimal application downtime. Likewise, I work with support tickets to fix application/software level issues. I also monitor log archiving, storage, backups, and recovery.

Recently, I have also started working on deploying applications in production using virtual machines and Docker.


# Why homelab?

I cannot preach to everyone. I will list the reasons why I started a homelab below.


- I like to work with Linux servers. It does not matter how much I learn and use Linux, servers, and virtualization. It seems like there is always something new to learn. There is an aspect of novelty that I derive from doing labs.

- I like to challenge myself. I still feel that although my Linux skills are intermediate level, I do not even have a beyond-working-level proficiency with Kubernetes.


- I see a huge opportunity coming in the field of servers. Every institution will soon need lots of server admins and engineers to handle their servers, code, virtualization, and ci/cd.

You do not have to be forced to run a homelab. I am not going to keep my server up 24x7. It is a home"lab". Labs are not kept open 24x7. I will actually be labbing by deploying new stuff on this server. I will go beyond and ensure I make the deployments production-grade.

# Hardware

Hardware prices are really getting out of hand. And we are in Nepal. Hardware has never been cheap for us.

And they are even more expensive now. But I believe most of us in Kathmandu have at least one spare laptop with at least 8GB RAM and a 2-core CPU. It is absolutely enough to get started with homelabbing. It is definitely not enough if you want to host heavy-duty servers and applications. But you do not need to start there. First, learn to homelab, and later, when you earn more money, you can purchase the hardware of your choice.

My homelab is going to be an experiment in homelabbing with constrained resources.

I have two laptops:

The first laptop is a T450 ThinkPad. It has 12GB RAM, 2 cores/4 threads CPU.

> My thoughts on buying second-hand hardware for a homelab in Nepal
> Do not do it. Sellers overprice their hardware. Instead, save up and buy new hardware. 
> The foreign concept of buying used rigs to get the most value for money does not work here in Nepal.

The second laptop is an Acer Aspire Go 14 with 32GB RAM and 16 cores/22 threads CPU. It has Windows 11 installed on it, so only half of its resources will be available.

I have already deployed Proxmox on my T450 (bare metal).

I will use Ubuntu Server 26.04,44.04 and Rocky Linux 8, 9, and 10.

Using both Debian and Red Hat distributions ensures that I am prepared for any opportunity in the real world. 

This is what my homelab t450 looks like:

![t450 homelab](/images/blog/homelab/homelab-t450-1.jpg)

![t450 homelab2](/images/blog/homelab/homelab-t450-2.jpg)



# Loadshedding

Load shedding is a real problem in Nepal even now. Not that kind of loadshedding where power used to be cut for 18 hours. Thankfully, we are out of that situation.

We still get power cuts for a few minutes to an hour once in a while. If you are using a device without a battery, I strongly urge you to take care of providing proper UPS backup to it.

For example, if you own a mini PC, even an 800VA UPS will be helpful.

My T450 ThinkPad has a battery that can last about an hour. So, loadshedding is not a concern for me. And my Acer Aspire Go 14 is a laptop that also has a battery. On top of that, I have never designed my homelab to run critical services 24x7.


# My journey

I am using a combination of VirtualBox virtualization and Proxmox VE virtualization.

Note that you will be at ease if you use an Ethernet port for internet in your Proxmox VE machine(instead of wireless).

The most useful thing I have deployed is **[changedetection.io](https://changedetection.io/)** for monitoring loksewa vacancies.