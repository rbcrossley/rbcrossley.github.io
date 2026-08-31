---
title: Devops blog 1
description: DevOps blog 1
date: 2026-07-18
author: BerojgarEngineer
image: /images/blog/ct.png
---
Deploy gitlab on premises.
Deploy jenkins on premises.

polling and basic webhook lab

polling is a popular computer science terminology. in computer science, polling is said to be done for the io operation, when cpu continuously checks the readiness of io device for starting data transfer.

in the context of jenkins and git, the term polling means it is a mechanism where jenkins periodically checks the git repository. if changes are detected, jenkins triggers the build.

this is suitable only for projects with infrequent commits or those projects where real time builds are not required.

webhook is a notification system where the git repository informs jenkins as soon as the changes are pushed to the repository.
this method allows jenkins to trigger builds in real-time. Here there is no need for jenkins server to continuously check the github repository for changes.
hence it is more efficient.

there are two types of webhook integrations when using gitlab with jenkins.
# preriquisites
- rocky linux 10.1 is the os being used
- there is one jenkins node
- there is another gitlab node
- each of jenkins and gitlab node have a bridged IP that is available to connect with the internet.
- each of the jenkins and gitlab nodes should have root ssh login enabled.
- ssh should be enabled in the system
- firewall should be configured to allow http, https and ssh.
- windows 10 with git or git bash installed. it is just for pushing code to self-hosted gitlab, so even a mac will suffice.
- gitlab version: GitLab Community Edition v19.2.0, which is the latest available from the repository at the time of writing this article
- jenkins version: 2.555.2, which is the latest avaiable from the official repository at the time of writing this article.

# install gitlab

I will install gitlab community edition (instead of the enterprise edition which is a premium product).

this will add the gitlab repository to this rockylinux.

curl --location "https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.rpm.sh" | sudo bash

to install gitlab now

dnf install -y gitlab-ce

configure external url by visiting /etc/gitlab/gitlab.rb file using a vi editor
```
vi /etc/gitlab/gitlab.rb
```
Find the line with external_url and set it to the IP address of your server.
example:


external_url 'http://GITLAB_SERVER_IP'

You could also configure hostnames here.

Now run

gitlab-ctl reconfigure


gitlab by default runs at port 80. so, visit http://GITLAB_SERVER_IP:80

Ensure that firewall allows port 80. I have just disabled firewall for this lab. `systemctl disable --now firewalld`.



# sign in to gitlab



visit  http://192.168.1.81:80 for accessing the gitlab server.

username=root
password is in /etc/gitlab/initial_root_password

Skip the initial popup boxes. do not do anything.


# create a repository and push from windows machcine

now we will create a git repository and push it to the gitlab hosted in 192.168.1.81 from our host computer(i.e., windows 10 in my case).


first of all Add a new user to gitlab by visiting this URL.

http://192.168.1.81/admin/users/new


Name: berojgar engineer
Username: berojgarengineer
Email: admin@berojgarengineer.com

create a password for user name it simplepassword.



create a new group named group4gitlab.

then by clicking on the group4gitlab page(its url should be like this http://192.168.1.81/group4gitlab), click at the + button around the top right corner. Then add members to this group. And add berojgarengineer to this group.


then create a new repository on that group.

name it: repo4jenkins
keep it private

Copy the "Clone with HTTP" URL:
in my case it is this:

http://192.168.1.81/group4gitlab/repo4jenkins.git


password based authentication in self-hosted gitlab do not work. so we need personal access token (PAT) even after creating the password. the password is just for login.

login to that user. change the password to something like F1s0ft@123#

check the top right corner->edit profile->access->personal access tokens
now generate a PATname: gitlabPAT

for group and project access: select all groups and projects that i am a member of

for permissions, in Resource Access tab, select Repository and then in the right part(where you are selecting permissions actually), select create,delete,read, update permission for the repository box. and for the code, do download, push, and read.


The token looks like this, save it because you cannot see it again.

glpat-kQED25H3HDjP3a2zyiaRvm86MQp1OjMH.01.0w1ypz0jg


login to gitlab as admin
go o the repo folder

http://192.168.1.81/group4gitlab/repo4jenkins
check the left sidebar settings.
choose repository
go to protected branches. then unprotect that branch.

In windows 10 desktop:

create a lab4git folder

enter inside that folder.

initialize a git repository

git init

set the username and email for git config.


git config user.name "berojgarengineer"
git config user.email "admin@berojgarengineer.com"


add the repo origin in windows 10.

git remote add origin http://192.168.1.81/group4gitlab/repo4jenkins.git

to allow authentication over http only.

git config credential.allowUnsafeRemotes true

try pushing something to the repo to ensure that it works

echo "Test" > hello.md



git add .
git commit -m "initial commit"
git push -u origin main --force

the commit wil lbe successful. now actually push the required stuffs




create a script named superscript.sh and paste the following in it.

you can do notepad superscript.sh and it will open a new notepad where you can paste the following code.

```
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

add it to git


git add .
git commit -m "initial commit"
git push -u origin main


now create a new freestyle project.

go to source code management, choose git.

then add the repository url as the http url.

http://192.168.1.81/group4gitlab/repo4jenkins.git

put the credentials by adding it.
specify the branch as main


in the build trigger->choose poll scm.


in build steps->add built step->execute shell. we will execute the earlier superscript.sh script.

```
chmod +x superscript.sh
./superscript.sh
```

In Post-build Actions, click Add post-build action → Archive the artifacts

in the files to archive, put the output fiile from the script i.e., system_report.txt.

now jenkins checks the repository at every 5 minutes(regular intervals) based on the cron expression. since polling happens periodically, there might be a delay between pushing changes and triggering the build.

even if no changes are going to be found, jenkins still checks the repository, which can consume unnecessary resources.

# webhook way

go to jenkins. edit that earlier freestyle job->triggers->generic webhook trigger, add token=my-token. And save it.

add a new webhook. you have to be a gitlab admin for this purpose.

go to settings in the left sidebar of the repo project.

then click add new webhook.

give the url as:

http://192.168.1.77:8080/generic-webhook-trigger/invoke?token=my-token



this is a listener in our jenkins side. it listens to notification made by gitlab.

make sure you check the trigger push events->all branches and disable ssl verification.

note the below fix if you get URL invalid error.


# gitlab blocks webhooks from poiting to internal networks to prevent ssrf
fix goes here:


Click on the Admin Area (the wrench icon in the top navigation bar or left menu).

In the left sidebar, navigate to Settings > Network.

Scroll down to the Outbound requests section and click Expand.

Simply check the box for "Allow requests to the local network from webhooks and integrations".

Click Save changes at the bottom of that section.



now click on test webhook, it should work. to test if it worked, visit.

http://192.168.1.77:8080/generic-webhook-trigger/invoke?token=my-token

# on windows 10 host

let's commit something so that the webhook responds.


echo "testing webhook" >> README.md

git add .
git commit -m "Testing global webhook trigger"
git push

gitlab will notify jenkins in real-time using the webhook.

webhooks are efficient. they provide real-time triggering.

