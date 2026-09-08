---
title: Glassfish 4.1 Deployment in Red Hat distribution Linux(Centos 7)
description: Tried and tested in production. Originally deployed in Centos 7 but works fine with any other Rocky/Alma/Red Hat based distributions
date: 2026-09-08
author: BerojgarEngineer
image: /images/blog/glassfish.jpg
---


# Add User

```bash
useradd techyman
passwd techyman
# Enter password when prompted
```

# Install Java JDK 8

Download the required JDK 8 `.tar.gz` archive from the Oracle website.

Switch to the `techyman` user:

```bash
su - techyman
```

Download/copy the JDK archive to `/home/techyman/`.

Extract it:

```bash
tar -zxvf jdk1.8.0_77.tar.gz
```

Rename the extracted JDK directory:

```bash
mv jdk1.8.0_77 .java
```

# Configure Java Environment

Remain logged in as `techyman` and edit the Bash profile:

```bash
vi ~/.bash_profile
```

Add:

```bash
# User specific environment and startup programs

PATH=$PATH:$HOME/.local/bin:$HOME/bin

export JAVA_HOME=/home/techyman/.java
export PATH=/home/techyman/.java/bin:$PATH
export PATH
```

Apply the changes:

```bash
source ~/.bash_profile
```

Verify Java:

```bash
java -version
```

You should see Java 8, for example:

```text
java version "1.8.0_171"
```

> **Note:** The exact Java 8 update version depends on the JDK archive you installed.

# Install GlassFish 4.1

Download `glassfish4.1.zip` from the GlassFish official website.

Install `unzip`:

```bash
yum install unzip -y
```

From the `techyman` user's home directory, extract GlassFish:

```bash
unzip glassfish4.1.zip
```

The GlassFish installation should now be available under:

```text
/home/techyman/glassfish4
```

# Disable Firewall and SELinux

Disable `firewalld`:

```bash
systemctl disable firewalld
```

Edit the SELinux configuration:

```bash
vi /etc/selinux/config
```

Change:

```text
SELINUX=enforcing
```

to:

```text
SELINUX=disabled
```

> **Note:** Disabling SELinux and the firewall is generally not recommended on production systems(But honestly it does not matter, you do not keep your bet on OS level firewall in production LMAO). This is included here because it was part of the original setup procedure.

# Create GlassFish Systemd Service

Create the service file:

```bash
vi /etc/systemd/system/glassfish.service
```

Add:

```ini
[Unit]
Description=GlassFish Server v4.1
After=syslog.target network.target

[Service]
User=techyman
Group=techyman
ExecStart=/home/techyman/.java/bin/java -jar /home/techyman/glassfish4/glassfish/lib/client/appserver-cli.jar start-domain
ExecStop=/home/techyman/.java/bin/java -jar /home/techyman/glassfish4/glassfish/lib/client/appserver-cli.jar stop-domain
ExecReload=/home/techyman/.java/bin/java -jar /home/techyman/glassfish4/glassfish/lib/client/appserver-cli.jar restart-domain
Type=forking

[Install]
WantedBy=multi-user.target
```

Reload systemd:

```bash
systemctl daemon-reload
```

Enable GlassFish at boot:

```bash
systemctl enable glassfish.service
```

Start GlassFish:

```bash
systemctl start glassfish.service
```

Check the service status:

```bash
systemctl status glassfish.service
```

# Port 4848 Issue

Sometimes GlassFish may report an error such as:

```text
There is a process already using the admin port 4848
```

even when no process appears to be using port `4848`.

This can happen after modifying the system hostname.

The issue is related to GlassFish's domain configuration and hostname resolution.

Refer to the following article for the workaround:

https://www.adam-bien.com/roller/abien/entry/when_there_is_a_process

# Create GlassFish Domains

Navigate to the GlassFish `asadmin` directory:

```bash
cd ~/glassfish4/glassfish/bin
```

Change the admin password:

```bash
./asadmin change-admin-password
```

Enable secure administration:

```bash
./asadmin enable-secure-admin
```

Create the domains using different port bases:

```bash
./asadmin create-domain --portbase 5000 a
./asadmin create-domain --portbase 6000 b
./asadmin create-domain --portbase 7000 c
./asadmin create-domain --portbase 8000 d
./asadmin create-domain --portbase 9000 e
```

This creates:

```text
a → portbase 5000
b → portbase 6000
c → portbase 7000
d → portbase 8000
e → portbase 9000
```

# Delete a GlassFish Domain

To delete domain `a`:

```bash
./asadmin delete-domain --portbase 5000 a
```

> **Important:** The original command used `-port 5048`. For `create-domain`/`delete-domain`, the relevant option is `--portbase`.
>
> For example, with:
>
> ```bash
> ./asadmin create-domain --portbase 5000 a
> ```
>
> the admin port is typically:
>
> ```text
> 5048
> ```
>
> **Remember: port 48 is added to the port base for the admin port.**
