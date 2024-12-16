---
title: "Linux Administration Projects"
slug: "linux-projects"
added: "2024-12-16"
description: ""
layout: ../layouts/BlogPost.astro
---

The projects are classified as follows:
- Server Administration
- Database Administration
- Bash Scripting
- etcs

### Server Administration Project Ideas

#### Static Website
Manually set up a web server (Apache/Nginx) to host a static site.

#### NGINX security headers
Understand & configure NGINX security headers. 

#### Dynamic Website
Host a dynamic site using a LAMP/LEMP stack.

#### SSL automation
Create a fully automated renewal script using letsencrypt.

#### Monitoring
Set up Nagios for basic system monitoring (CPU, memory, disk).
Deploy Graylog for log management and centralization.

#### Alerting Solutions
Send alerts using mail server. Integrate it with monitoring application.

#### Distributed Storage
Set up a GlusterFS,NFS client and server.

#### Backup and Recovery
Implement BorgBackup. Automate the backups with cron jobs and systemd timers.

#### Networking
Set up a VPN using openvpn or wireguard

#### Active Directory
Self hosted active directory server.

#### NTP server
Setup a time server and synchronize time across a cluster.

#### Setup BIND DNS server
Learn to configure DNS and email server, specially those DNS records.

#### PAM
Self host PAM for authentication.

#### SSH Hardening
Look into ways to harden the SSH server.

#### Linux server Hardening
Harden Linux server(selinux, firewall, SSH, fail2ban)


#### ELK stack
Deploy ELK stack for centralized logging and implement it on some software.

#### CI/CD
Selfhost jenkins, gitlab, docker image repository, k3s cluster and do a small CI/CD project.

#### PI-hole 
Create a pihole server to filter out ads in your home network.

#### Private cloud 
Setup your own google-drive alike system.

#### Host everything from awesome selfhosted's list in bare metal linux server
Yes.

#### Vagrant
Deploy VMs using this.

---

### Database Administration Project Ideas


#### Database Server replication
Design a db server replication using master-slave on mysql. Dive deep into distributed systems

#### Database Backup and Restoration
mysqldump, mysqlhotcopy, binary log
Look into percona xtrabackup.

#### Database clustering and sharding
dive deep into ndb clustering in mysql.

#### Database performance tuning+query optimization
Learn 

#### Database monitoring
MySQL workbench


#### Database migration
From one application to another, from one flavor to another.

---


### Bash Scripting Project Ideas

#### SSL expiry monitoring and alert system
Create a system that tracks the SSL expiry of local websites and sends an alert to email.

#### Cronjob writer
Create a cronjob writer that writes cronjob for you based on some questionnaire.

#### grep,sed,awk
Learn data cleaning/processing with these command line tools.

#### Typing Speed Calculator 
Create a bash script to calculate the typing speed in wpm.

#### api 
Use jq and relevant command line tools to fetch data from various open sourced APIs and build a command line tool around it.

#### Cyber ops with bash
Read the book cyber ops with bash to leverage linux command line and scripting for cyber security.

---


### etcs(As per interested field of expertise)

- Look into MLops. Deploy ML models on Linux servers.
- Look into OWASP top 10 and replicate(attack and defend using code whenever) each of the scenarios in your stack of choice.
- Start implementing microservices on spring boot.


---



For every of the above projects(if reasonable/possible):
- use bash scripting to automate.
- use configuration management tool like ansible to automate.
- Dockerize.
- Deploy to k3s.
- Write documentation for each of them.