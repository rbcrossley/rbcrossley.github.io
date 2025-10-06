---
title: "How to transition from Support to DevOps"
slug: "how-to-transition-from-technical-support-to-devops-engineering"
added: "2025-10-03"
description: "best books to learn programming foundations"
layout: ../layouts/BlogPost.astro
---
I am a technical support engineer who is working to transition to a DevOps Engineer. And I wanted to document my journey.

As a support engineer it was all about solving tickets that could be solved from your side. Otherwise escalate it and keep track of those tickets between clients and concerned internal team.


It is interesting to think how DevOps engineer differs from technical support engineer. Because while working as a support engineer, I was working with kubernetes, docker, linux terminal, jenkins, gitlab, NGINX, rancher and many other tools that one thinks "DevOps engineers" use.

I believe like technical support you still wear a lot of hats but at a deeper level of expertise.

In all honesty you are a DevOps Engineers if you are compensated well.  :D

The distance between you and the end users of the software that you are handling "DevOps" for might be increased. For example, as technical support engineer, I used to communicate with technical folks from client company. They would in turn be communicating with non technical operations team from their own company. Who in turn would communicate with end users of the software.

If the role title a System Engineer, I have seen it can differ. Generally, your end users become developers and other staffs within your company. Here you will be looking at company's internal products. Nothing public facing. This is what I have experienced in Nepal. 

Very few companies have public facing products for Nepali market. So most of the tasks you will be doing might be related with internal tooling.


As a DevOps engineer, You will  implement various tools and technologies to solve bigger and more valuable business problems as presented below.


For deciding what should I learn,I scanned over 30 job descriptions for Senior DevOps engineer/Network Administrator/System Engineer/Database Administrator in Nepal. Why for senior role?

Because that helps me to prepare for the future. 

I am aware that the future might be different. The tools in demand today might lose their importance over time. That is why the focus will be on foundations that have passed the test of time. I will do my best to cover the foundations instead of just learning to use the tools when I am learning in this journey. 

For example: Instead of just learning about how to use prometheus and Grafana, my focus will be on learning observability engineering from conceptual perspective.


# The plan to transition

I will go the both forward and reverse preparation route. i.e. Start with interview questions(reverse prepare) as well as start with specific skillsets and start learning them.

Interview questions can be found on internet. Even recruiters type the same keyword for researching interview questions like you do.

I will be investing in a home laboratory environment. 

I will go with a new computer that has the following specifications:

- More than 10 effective cores or threads

- >=24GB RAM

- 512GB SSD

Ensure that you do not just  "read a book" or "watch a course". Practice everything in your lab. And document it. It does not need to be public. I prefer keeping my private notes in Obsidian. 


Step 1: Intermediate Linux system administration

I have been working with Linux since 3 years. Still I feel there are areas that I could improve my understanding upon:

Resources to be used:

https://www.udemy.com/course/mastering-linux/

I am already halfway through the course. I will work on completing it. It is a tediously long course. 71 hour long. Oof.


For finding out what topics to learn, I will be going through Unix and Linux System Administration Handbook by Evi Nemeth which I bought 2 years ago. It is time to finish this.

I will be revising my shell scripting skills.



Step 2: Ansible, pre-k8s era


Learn Ansible. Since I am going to start with Kubernetes in step 5, I will prepare myself for kubernetes. There is an excellent book called "The road to kubernetes" by Manning. Here is the link to download for free.

https://www.linode.com/linode/en/documents/ebook/2025/road-to-kubernetes.pdf

This is not just a book about Ansible. Just as the title, it covers how things worked before containers and container orchestration.



Step 3:

As a DevOps engineer in Nepal, you need to have strong networking fundamentals.

I pulled out all the important fundamentals listed in various job descriptions for DevOps engineers in Nepal.

- TCP/IP, DNS, DHCP, VPN

- Load balancing concepts

- SSL/TLS certificate management

- VPC setup, subnets, routing

I have already studied computer networks. That is a huge benefit for me. I will be deploying pfsense on homelab and learning to administer it for a while. I think it will cover most of the networking concepts practically for my immediate transition to a junior devops engineer.



Step 4: Jenkins

Jenkins is the most commonly sought for skillset in Nepal. There are more modern tools like Gitlab CI, ArgoCD. Maybe they too will be slowly adopted in Nepal. I am still undecided about which one to go for. 


Step 5: Containers

The next step is to study containers and container orchestration. I have pre-ordered the second edition of Marko Luksa's Kubernetes in Action book.

It is arriving on January 6. I am excited to read it.

Step 6: Observability

Learn about observability. Logging, monitoring, visualizing etc.


Step 7: Programming

Python was mentioned in 70% of job descriptions. Personally I am familiar with programming in a different language. I can pick up Python within few weeks. Hence I will not be spending too much time on this. But I highly recommend this.

Read my [blog](https://rbcrossley.github.io/post/best-java-books-for-beginners/) about how and why I learn java as a programming language.

Step 8: Cloud

AWS seems to be the most popular. 

Step 9: Infrastructure as Code

I will be studying about Terraform.

Step 10: Certifications

RHCSA, CKA and AWS related certifications seem to be the most sought after in Nepalese Industry. 


My concerns about the DevOps job market in Nepal:

On call rotations seem to be standard in Nepali industry. There is an ethical concern. Is their work life balance taken care of?


# Senior level concepts


- security and hardening OS, web servers etc

- Identity and Access Management 

- database reliability engineering

- Designing Data Intesive Applications (Distributed Systems Concepts)