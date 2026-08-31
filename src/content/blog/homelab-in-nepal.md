---
title: Homelabbing in Nepal
description: Homelabbing in Nepal with constrained resources
date: 2026-08-31
author: BerojgarEngineer
image: /images/blog/homelab.png
---

# whoami

I am a support engineer with more than two and a half years of experience and counting. I mainly work with Linux and Windows servers and Kubernetes.

My goal as a support engineer is to ensure minimal application downtime. Likewise, I work with support tickets to fix application/software level issues. I also monitor log archiving, storage, backups, and recovery.

Recently, I have also started working with deploying applications in production using virtual machines and Docker.


# Why homelab?

I cannot preach for everyone. I will list the reasons why I started homelab below.


I like to work with Linux servers. It does not matter how much I learn and use Linux, servers, and virtualization. It seems like there is always something new to learn. There is an aspect of novelty that I derive from doing labs.

I like to challenge myself. I still feel that although my Linux skills are intermediate level, I do not even have a beyond working level proficiency with Kubernetes.


I see a huge opportunity coming in the field of servers. Every institution will soon need lots of ITops engineers to handle their servers, code, virtualization, and ci/cd. I am 100% sure about it. Be it as small as a startup or as big as a corporate/bank or MNC.

You do not have to be forced to homelab. I am not going to keep my server up 24x7. It is a home"lab". Labs are not kept open 24x7. I will be actually labbing by deploying new stuff in this server. I will go beyond and ensure to make the deployments production-grade.

# Hardware

Hardware prices are really getting out of hand. And we are in Nepal. Hardwares have never been cheap for us.

And they are even more expensive now. But I believe most of us in Kathmandu have at least one spare laptop with at least 8GB RAM and 2 cores CPU. It is absolutely enough to get started with homelabbing. It is definitely not enough if you want to host heavy duty servers and applications. But you do not need to start there. First learn to homelab and later when you earn more money, you can purchase the hardware of your choice.

My homelab is going to be an experiement in homelabbing with constrained resources.

I have two laptops:

The first laptop is a T450 ThinkPad. It has 12GB RAM, 2 cores/4 threads CPU.

The second laptop is a Dell Inspiron. It has 8GB RAM, 2 cores/4 threads CPU.

That is all I have.

But I do not need to worry that much.

Because either a Beelink SER9 or a GMKtec K16 is on my bucket list.

A K16 will cost me 1L 40k, whereas a SER9 will cost me 1L 60k(based on my preliminary research).

I have already deployed Proxmox on my T450 (bare metal).

I will use Ubuntu Server 26.04 and Rocky Linux 8, 9, and 10.


Using both Debian and Red Hat distributions ensures that I am prepared for any opportunity in the real world. 



# Loadshedding

Until I purchase a mini PC, power is not an issue because my T450 has a battery that lasts for hours. And power cuts in Kathmandu do not usually happen for hours.

But once I get a mini PC, it will be crucial that I get some UPS. I am seeing some UPS in the market and will likely get one from sirpower.com.np.

The reason behind it is that sudden power fluctuations or cuts will degrade the mini PC.

I do not think I am going to use a lot of bandwidth, as I already clarified that I will only "lab" in my homelab. I will not use it for production hosting purposes. It will be for learning purposes only. That is why I think I will be fine.


A good UPS for a mini PC will cost me around 20,000 NPR.


My immediate goal is to learn production-grade hardening and security.


If you are also interested in all this stuff, join the Discord server given below:

https://discord.gg/qmsBvjPbCX





I honestly have no idea how I will approach learning production systems principles for deploying applications. I feel like I will have to explore it myself with huge time dedication. I can deploy applications on servers or kubernetes. But I do not feel confident if someone would put those services in production. My concerns are:

- is my server secure?
- are my services secure?
- Are my servers and services complaint with audit and regulatory requirements?
- how will I recover the server in case of failure? or in case of disaster?

And many more.

For learning all these interesting stuffs, I have been exploring some udemy courses. 

Currently these courses are on my wishlist.

[link to courses image](https://imgur.com/a/xMmPCiK)

Some of the courses I think I will surely take are:

1) Master Docker & Containers: Hands-On DevOps Training-Hindi

https://trk.udemy.com/aN9xOQ

This is by Cloudfolks hub. I am enrolled in their jenkins course and I am loving it. That is why I think I will love this course too. The good thing is that they actually teach to deploy ELK stack in docker compose which is what I also want to do as a project.

2) DNS Deep Dive

https://trk.udemy.com/ZVvx6W

This is 5h masterclass in DNS. I liked the preview of the course and the fact that instructor actually shows how to host your own DNS server and secure it as well. So I think I will get it.

3) System Design & Architecture Masterclass + Case Studies


https://trk.udemy.com/4axraG

This course I feel is more important than I would think. The reason is that I can deploy applications following the steps but the networking, application and stuffs like that does not make sense to me how they connect. Beyond a basic network architecture, it feels to me that I lack the core concepts of application layer networking. Since I believe this course will help me on getting this concept, I will be getting this course

4) The Perfect NGINX Server - RHEL 10 Edition


https://trk.udemy.com/rEqzEB

This is the course that I will definitely get. Because it exactly contains what I want to  learn. You can check the course for more information.



