---
title: Jenkins Lab Project
description: Jenkins Lab Project
date: 2026-11-17
author: BerojgarEngineer
image: /images/blog/thumbnail-nrb-it-ad.png
categories:
  - it-careers
draft: true
---

# Three servers
192.168.1.82
- for jenkins

192.168.1.83
192.168.1.84

# Jenkins server
- Install java
```
sudo apt update
sudo apt install fontconfig openjdk-21-jre
```
- check if java is installed
```
java -version
```
![](java%20version%20in%20ubuntu.png)

- download and install jenkins
```
sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key
echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc]" \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install jenkins
```
Tip: while starting jenkins, you might get the following error:
```
Nov 14 15:01:11 ubuntu systemd[1]: Failed to start jenkins.service - Jenkins Continuous Integration Server.
Nov 14 15:01:33 ubuntu systemd[1]: jenkins.service: Start request repeated too quickly.
Nov 14 15:01:33 ubuntu systemd[1]: jenkins.service: Failed with result 'exit-code'.
Nov 14 15:01:33 ubuntu systemd[1]: Failed to start jenkins.service - Jenkins Co
```
If you get this error, it means your java version is not compatible with jenkins version. Update your java version and it will fix itself.
