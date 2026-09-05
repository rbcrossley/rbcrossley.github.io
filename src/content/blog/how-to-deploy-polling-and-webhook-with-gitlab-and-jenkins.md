---
title: GitLab and Jenkins, Polling vs Webhook Integration
description: Learn how to connect self-hosted GitLab and Jenkins using Poll SCM and webhooks, with a practical Rocky Linux lab setup.
date: 2026-09-05
author: BerojgarEngineer
image: /images/blog/gitlab.jpg
---

# GitLab + Jenkins: Polling vs Webhook Integration (Self-Hosted Lab)

In this lab, we self-host GitLab and Jenkins on-premises and connect them two ways: **polling** and **webhooks**. We'll set up a freestyle Jenkins job, trigger it both ways, and see why webhooks are the better approach in practice.

Everything written here is lab tested, not just once but multiple times.

## Polling vs Webhook: The Concept

**Polling** is a common computer science term. In general, polling means the CPU continuously checks whether an I/O device is ready to start a data transfer.

In the context of Jenkins and Git, polling means Jenkins periodically checks the Git repository for changes. If it finds any, it triggers a build. This works fine for projects with infrequent commits or where real-time builds aren't required, but it wastes resources checking a repo that often hasn't changed, and introduces a delay between the push and the build.

A **webhook**, on the other hand, is a notification system: the Git repository informs Jenkins the moment changes are pushed. This lets Jenkins trigger builds in real time, with no need to continuously poll the repository, making it more efficient.

There are two common ways to connect GitLab and Jenkins for webhooks: through GitLab's built-in Jenkins integration, or through Jenkins' Generic Webhook Trigger plugin (which we'll use here).

## Prerequisites

- Rocky Linux 10.2 as the OS
- One Jenkins node and one separate GitLab node
- Both nodes have a bridged IP reachable from the internet
- Root SSH login enabled on both nodes
- SSH enabled on both systems
- Firewall configured to allow HTTP, HTTPS, and SSH
- A Windows 10 machine with Git or Git Bash installed (used only to push code to the self-hosted GitLab, a Mac would work just as well)
- GitLab version: GitLab Community Edition v19.2.0 (latest available from the repo at the time of writing)
- Jenkins version: 2.555.2 (latest available from the official repo at the time of writing)

## Installing GitLab

We'll install GitLab Community Edition (not the paid Enterprise Edition).
Gitlab cannot boot with 1 core vCPU and 2 GB RAM. It will need more than that. You can tweak around what it needs and tune around it but I will go with 2 core vCPU and 4GB RAM.
Add the GitLab repository to Rocky Linux:

```bash
curl --location "https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.rpm.sh" | sudo bash
```

Install GitLab:

```bash
dnf install -y gitlab-ce
```

Open the config file and set the external URL:

```bash
vi /etc/gitlab/gitlab.rb
```

Find the `external_url` line and set it to your server's IP address:

```
external_url 'http://GITLAB_SERVER_IP'
```

(You can use a hostname here instead, if you have one.)

Apply the configuration:

```bash
gitlab-ctl reconfigure
```

GitLab runs on port 80 by default, so visit `http://GITLAB_SERVER_IP:80`. Make sure the firewall allows port 80 — for this lab, I simply disabled the firewall:

```bash
systemctl disable --now firewalld
```
# Install Jenkins
https://www.jenkins.io/doc/book/installing/linux/#red-hat-stable

We will install the Long Term Support jenkins from the script provided in the jenkins official website.

```
sudo wget -O /etc/yum.repos.d/jenkins.repo \
    https://pkg.jenkins.io/rpm-stable/jenkins.repo
sudo yum upgrade
# Add required dependencies for the jenkins package
sudo yum install -y fontconfig java-21-openjdk
sudo yum install -y jenkins
sudo systemctl daemon-reload
```
## Signing in to GitLab

Visit `http://192.168.1.81:80` to access the GitLab server.

- Username: `root`
- Password: found in `/etc/gitlab/initial_root_password`

Skip the initial setup popups , no need to interact with them.

## Creating a Repository and Pushing from Windows

Now we'll create a Git repository on GitLab (hosted at `192.168.1.81`) and push to it from our Windows 10 host.

**Add a new user.** Visit `http://192.168.1.81/admin/users/new` and create:

- Name: `berojgar engineer`
- Username: `berojgarengineer`
- Email: `abcd@berojgarengineer.com`

Set the password to `simplepassword`.(You will have to complete the above name,username,email procedure then save it and edit it back to set password).

**Create a group.** Name it `group4gitlab`. Open the group page (`http://192.168.1.81/group4gitlab`), click the **+** button in the top-right corner, and add `berojgarengineer` as a member.

**Create a repository inside that group.**(by clicking the + at the top right in group URL)

- Name: `repo4jenkins`
- Visibility: Private

Copy the "Clone with HTTP" URL , in this case:

```
http://192.168.1.81/group4gitlab/repo4jenkins.git
```

**Generate a Personal Access Token (PAT).** Password-based authentication doesn't work on self-hosted GitLab, so even though we set a login password, we still need a PAT for Git operations.

Log in as `berojgarengineer` and change the password to something like `12345abcde`. Then go to top-right corner → **Edit profile** → **Access** → **Personal Access Tokens**, and generate a fine grained token:

- Name: `gitlabPAT`
- Scope: all groups and projects that I'm a member of
- Permissions (Resource Access tab → Repository): select all permissions for the repository. Then in the right side, select individual permissions
- select create,delete,read, update permission for the repository box. and for the code, do download, push, and read.

You'd also need to add token description for proceeding onwards.

The token will look something like as show below, copy it now, since it won't be shown again:

```
glpat-u0wuW8HGbBV9CpPCGvbSgm86MQp1OjMH.01.0w0a0xup0
```

**Unprotect the default branch.** Log in as admin, go to the repo (`http://192.168.1.81/group4gitlab/repo4jenkins`) → left sidebar **Settings** → **Repository** → **Protected branches**, and unprotect the branch.

**On the Windows 10 machine:**

Create and enter a folder:

```
mkdir lab4git
cd lab4git
```

Initialize the repo and set your identity:

```bash
git init
git config user.name "berojgarengineer"
git config user.email "abcd@berojgarengineer.com"
```

Add the remote:

```bash
git remote add origin http://192.168.1.81/group4gitlab/repo4jenkins.git
```

Since we're authenticating over plain HTTP, allow it:

```bash
git config credential.allowUnsafeRemotes true
```

Test the push:

```bash
echo "Test" > hello.md
git add .
git commit -m "initial commit"
git push -u origin main --force
```

When Git prompts for credentials, use your GitLab username and the PAT (not the login password) as the password.

## Adding the Real Script

Create `superscript.sh` (you can use `notepad superscript.sh` on Windows) with the following:

```bash
#!/bin/bash
echo "System Report" > system_report.txt
echo "Generated on: $(date)" >> system_report.txt
echo "" >> system_report.txt
echo "Logged-in Users:" >> system_report.txt
who >> system_report.txt
echo "" >> system_report.txt
echo "System Uptime:" >> system_report.txt
uptime >> system_report.txt
echo "System report generated: system_report.txt"
```

Commit and push it:

```bash
git add .
git commit -m "add system report script"
git push -u origin main
```

## Setting Up the Jenkins Job

Create a new **Freestyle project** in Jenkins.

**Source Code Management:** choose Git, and set the repository URL to:

```
http://192.168.1.81/group4gitlab/repo4jenkins.git
```

Add your GitLab credentials (username + PAT), and specify the branch as `main`.

**Build Triggers:** choose **Poll SCM** (leave the schedule at its default, which checks every few minutes).

**Build Steps → Execute shell:**

```bash
chmod +x superscript.sh
./superscript.sh
```

**Post-build Actions → Archive the artifacts:** set the file to archive as `system_report.txt`.

With Poll SCM, Jenkins checks the repository at regular intervals based on the configured cron expression  by default, every 5 minutes. Because polling happens periodically, there's a delay between pushing changes and triggering the build. And even when nothing has changed, Jenkins still checks the repository every time, which wastes resources.

## Switching to Webhooks

Go back to the Jenkins job → **Configure** → **Build Triggers** → check **Generic Webhook Trigger**, and set the token to `my-token`. Save.

**On GitLab**, add a new webhook (you need to be a GitLab admin for this). Go to the repo's left sidebar → **Settings** → **Webhooks** → **Add new webhook**, and set the URL to:

```
http://192.168.1.77:8080/generic-webhook-trigger/invoke?token=my-token
```

This is the listener on the Jenkins side that receives GitLab's notifications.

Check **Push events → All branches**, and disable SSL verification (since this is a lab without HTTPS).

**If you get a "URL is blocked: Requests to the local network are not allowed" error:**

GitLab blocks webhooks pointing to internal/local networks by default, to prevent SSRF attacks. To fix it:

1. Go to **Admin Area** (wrench icon in the top nav or left menu)
2. **Settings** → **Network**
3. Expand **Outbound requests**
4. Check **Allow requests to the local network from webhooks and integrations**
5. Click **Save changes**

Now click **Test webhook**  and  it should succeed. You can also confirm the endpoint is reachable by visiting:

```
http://192.168.1.77:8080/generic-webhook-trigger/invoke?token=my-token
```

**On the Windows 10 host**, commit something to trigger the webhook:

```bash
echo "testing webhook" >> README.md
git add .
git commit -m "testing global webhook trigger"
git push
```

GitLab will now notify Jenkins in real time via the webhook so no polling delay, no wasted checks. That's the core advantage webhooks have over polling: they're efficient and trigger builds instantly.