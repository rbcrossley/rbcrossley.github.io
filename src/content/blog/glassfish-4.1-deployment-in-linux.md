---
title: Glassfish 4.1 Deployment in Red Hat distribution Linux(Centos 7)
description: Deploy GlassFish 4.1 on CentOS 7 or Red Hat Linux with this practical guide to Java installation, domains, services, configuration, and deployment testing.
date: 2026-09-08
author: BerojgarEngineer
image: /images/blog/glassfish.jpg
---

If you work in support for a Nepali bank, insurance company or any organisation running enterprise Java applications, sooner or later you will meet GlassFish. Plenty of core banking modules, reporting systems and internal portals built between 2012 and 2018 run on it, and those systems do not get rewritten just because a newer application server exists.

GlassFish 4.1 is the reference implementation of Java EE 7. That is worth knowing because it means it implements the specification exactly, which is why it was chosen for so many vendor supplied applications. It is also why you cannot simply swap it for something newer without the vendor's blessing.

This guide covers a full GlassFish 4.1 deployment on a Red Hat based server, from creating the service user through to running multiple domains on one machine. I am documenting the procedure as I ran it on CentOS 7, which is the platform most of these legacy deployments sit on. It applies equally to RHEL 7 and to older Oracle Linux installs.

**What this guide assumes:** a fresh CentOS 7 or RHEL 7 server, root access, and at least 4 GB of RAM if you plan to run several domains. GlassFish 4.1 requires Java 8 specifically, and that constraint drives several decisions below.

## Why Java 8 and not something newer

GlassFish 4.1 will not run on Java 11 or later. This is not a matter of warnings you can ignore. Java 9 introduced the module system and removed several internal APIs that GlassFish 4.1 depends on, so it fails at startup rather than degrading gracefully.

If you need a modern Java runtime, you need a newer application server: GlassFish 5.x for Java EE 8, or Payara, which is the actively maintained fork that many organisations moved to precisely because it kept receiving security patches. For an existing GlassFish 4.1 deployment, Java 8 is the requirement and you plan around it.

# Add User

Running an application server as root is the kind of decision that turns a single application vulnerability into a full server compromise. A dedicated unprivileged user contains the damage, and it also makes ownership obvious when you are looking at a process list months later.

```bash
useradd techyman
passwd techyman
# Enter password when prompted
```

Use whatever username fits your organisation's conventions. I am using `techyman` throughout so the paths stay consistent, but `glassfish` or an application specific name is just as valid. Whatever you pick, be consistent, because the systemd unit file later hardcodes these paths.

# Install Java JDK 8

Download the required JDK 8 `.tar.gz` archive from the Oracle website.

Oracle's JDK 8 downloads now require an account, and the licence terms changed in 2019 to restrict free commercial use. For most deployments the practical alternatives are OpenJDK 8, which is the same codebase under an open licence:

```bash
yum install -y java-1.8.0-openjdk-devel
```

Or a prebuilt OpenJDK distribution such as Eclipse Temurin, which is what I would reach for on a new build. The manual installation below is still worth following if your vendor requires the Oracle JDK specifically, which does happen with licensed banking software.

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

The leading dot makes the directory hidden, which is purely cosmetic, keeping the user's home directory tidy. It also means the path stays stable if you later swap in a different JDK 8 update version, since nothing references the version number.

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

`JAVA_HOME` is the variable GlassFish and most Java tooling read to find the runtime. Setting it wrong, or leaving it pointing at an old JDK, produces startup errors that look nothing like a Java version problem.

Note that the JDK's `bin` directory is prepended to `PATH` rather than appended. That ordering matters on a server where a system Java is already installed: prepending guarantees `java` resolves to this JDK rather than whatever `yum` put in `/usr/bin`.

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

Confirm you are running the JDK you think you are, which catches the case where the system Java is still winning:

```bash
which java
echo $JAVA_HOME
```

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

The directories you will spend time in are `glassfish4/glassfish/domains`, which holds one subdirectory per domain including its configuration and logs, and `glassfish4/glassfish/bin`, which holds the `asadmin` tool that drives everything.

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

> **Note:** Disabling SELinux and the firewall is generally not recommended on production systems. This is included here because it was part of the original setup procedure I was following.

That note deserves expanding, because it is the step most likely to be copied without thought.

The argument you will hear in enterprise environments is that the host firewall is redundant, since traffic already passes through a hardware firewall and a load balancer before it reaches the application server. There is something to that in a properly segmented network. But it assumes the perimeter holds, and it does nothing about lateral movement once an attacker is already inside the network, which is the realistic threat model for most breaches.

The better approach costs almost nothing. Rather than disabling the firewall, open only the ports GlassFish actually needs:

```bash
firewall-cmd --permanent --add-port=8080/tcp   # HTTP listener
firewall-cmd --permanent --add-port=8181/tcp   # HTTPS listener
firewall-cmd --permanent --add-port=4848/tcp   # admin console
firewall-cmd --reload
```

The admin console on 4848 in particular should never be reachable from a general network. Restrict it to your management subnet, or reach it through an SSH tunnel.

For SELinux, prefer permissive mode over disabled while you are getting the deployment working. Permissive logs what it would have blocked without actually blocking it, which gives you the information to write proper policy later:

```bash
setenforce 0                      # until reboot
# or set SELINUX=permissive in /etc/selinux/config
```

Note that switching from `disabled` to `enforcing` later requires a full filesystem relabel and a reboot, which is a much bigger job than never disabling it in the first place.

# Create GlassFish Systemd Service

Without a service unit, GlassFish has to be started by hand after every reboot, and it will not restart if it crashes. The unit file below fixes both.

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

A few details in that file are doing real work:

`After=network.target` delays startup until networking is up. GlassFish binds to specific ports at startup and fails if the interface is not ready.

`User=techyman` is what actually enforces the unprivileged execution we set up earlier. Without it, systemd would run GlassFish as root regardless of who owns the files.

`Type=forking` tells systemd that the process it launches will fork and exit, leaving a child running. This matches how `asadmin start-domain` behaves. Get this wrong and systemd will think the service failed the moment it starts successfully.

Note that `start-domain` with no argument starts the domain named `domain1`. If you want this unit to manage a different domain, append its name to the `ExecStart` and `ExecStop` lines.

Reload systemd:

```bash
systemctl daemon-reload
```

Run `daemon-reload` every time you edit a unit file. systemd caches unit definitions, so without it your changes are ignored and you will spend an entertaining fifteen minutes wondering why.

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

If it fails, the systemd status output is usually too terse to diagnose from. The real information is in the domain's server log:

```bash
tail -f /home/techyman/glassfish4/glassfish/domains/domain1/logs/server.log
```

# Port 4848 Issue

Sometimes GlassFish may report an error such as:

```text
There is a process already using the admin port 4848
```

even when no process appears to be using port `4848`.

This can happen after modifying the system hostname.

The issue is related to GlassFish's domain configuration and hostname resolution.

This one is worth understanding rather than just applying the fix, because the error message actively points you in the wrong direction.

GlassFish checks whether the admin port is in use by trying to resolve and connect to the hostname recorded in the domain configuration. If the hostname was changed after the domain was created, that resolution fails or times out, and GlassFish reports the failure as "port in use" rather than "cannot resolve hostname". So you go looking for a phantom process that was never there.

Before applying the workaround, confirm the port genuinely is free:

```bash
netstat -tulpn | grep 4848
```

Empty output means you are looking at the hostname problem. Check that the current hostname resolves:

```bash
hostname
ping -c1 $(hostname)
```

If it does not, adding it to `/etc/hosts` resolves the issue in most cases:

```text
127.0.0.1   localhost your-new-hostname
```

Refer to the following article for the workaround:

https://www.adam-bien.com/roller/abien/entry/when_there_is_a_process

# Create GlassFish Domains

A domain in GlassFish is a self contained server instance with its own configuration, its own port range, its own logs and its own deployed applications. Running several domains on one machine lets you isolate applications from each other, so restarting one does not disturb the others, and gives each its own JVM heap.

This is a common pattern in enterprise deployments: one domain per application module, all on one physical or virtual server.

Navigate to the GlassFish `asadmin` directory:

```bash
cd ~/glassfish4/glassfish/bin
```

Change the admin password:

```bash
./asadmin change-admin-password
```

Do this before anything else. GlassFish ships with the admin user `admin` and a blank password, which is one of the first things any scanner checks for.

Enable secure administration:

```bash
./asadmin enable-secure-admin
```

This switches the admin console and remote `asadmin` connections to HTTPS. Without it, administrative credentials cross the network in the clear. It also enables remote administration, which was disabled by default, so pair it with the firewall rules discussed earlier.

GlassFish requires a restart after this change.

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

`--portbase` is the mechanism that keeps domains from colliding. Each domain needs roughly a dozen ports (HTTP, HTTPS, admin, JMX, IIOP, the debug port and others), and rather than configuring each one individually, GlassFish derives them all from the base by adding a fixed offset.

The offsets you will use most:

| Offset | Port with portbase 5000 | Purpose |
|--------|------------------------|---------|
| +48 | 5048 | Admin console |
| +80 | 5080 | HTTP listener |
| +81 | 5081 | HTTPS listener |
| +86 | 5086 | JMX monitoring |
| +37 | 5037 | IIOP |
| +9 | 5009 | JVM debug |

So the admin console for domain `a` is at `https://your-server:5048` and the applications it hosts are served from port 5080.

Leave at least 1000 between port bases, as in the example above, and the ranges cannot overlap.

Start a specific domain by name:

```bash
./asadmin start-domain a
./asadmin list-domains
```

# Delete a GlassFish Domain

To delete domain `a`:

```bash
./asadmin delete-domain --portbase 5000 a
```

Stop the domain before deleting it, and be aware that deletion removes the entire domain directory including its logs and any deployed applications. There is no undo.

```bash
./asadmin stop-domain a
./asadmin delete-domain a
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

# Deploying an application

Having a running domain is only half the job. Deploying a WAR or EAR file takes one command:

```bash
./asadmin --port 5048 deploy /path/to/application.war
```

The `--port` flag targets a specific domain's admin port, which is how you deploy to domain `a` rather than to `domain1`.

To confirm what is deployed, and to remove something:

```bash
./asadmin --port 5048 list-applications
./asadmin --port 5048 undeploy application-name
```

For a redeployment during testing, `redeploy` replaces the running application without an undeploy step. In production, most teams prefer a stop, deploy, start cycle so the state is unambiguous.

# Frequently asked questions

**Can I run GlassFish 4.1 on Java 11 or Java 17?**
No. GlassFish 4.1 depends on internal APIs removed in Java 9, so it fails at startup. You need GlassFish 5.x for Java EE 8, or Payara if you want an actively maintained server.

**Should I still use GlassFish for a new project?**
For a new project, no. GlassFish 4.1 no longer receives security updates. Payara is the direct migration path and is largely drop-in compatible, and WildFly is the other common choice. GlassFish 4.1 remains relevant because a great many existing systems run on it and must be supported.

**Where are the logs?**
`glassfish4/glassfish/domains/<domain-name>/logs/server.log`. This is the first place to look for any startup failure, and it carries far more detail than `systemctl status`.

**How much memory should I give each domain?**
The default heap is 512 MB, which is low for anything real. Set it per domain in `domain.xml` or with `asadmin create-jvm-options -Xmx2g`. Remember each domain is a separate JVM, so five domains at 2 GB each need 10 GB before you count the operating system.

**Why does the admin console refuse remote connections?**
Remote administration is disabled by default. Run `asadmin enable-secure-admin` and restart the domain. Then restrict access to port 4848 at the firewall.

**How do I start a domain automatically when there are several?**
Either create one systemd unit per domain, each naming its domain in `ExecStart`, or use a single unit calling `asadmin start-domain` once per domain. Separate units are easier to reason about when one domain needs restarting.

# Wrapping up

GlassFish is not the application server anyone would choose for a greenfield project today, but it is very much the one you will meet if you support enterprise Java systems in Nepal's banking and insurance sector. Knowing how to install it, run it under systemd as an unprivileged user, and carve a server into isolated domains is directly useful support engineering work.

The two things worth carrying forward beyond GlassFish itself are the portbase pattern, which is a neat solution to the general problem of running multiple instances on one host, and the habit of reading `server.log` rather than trusting the surface level error message. The port 4848 issue in this guide is a good illustration of why: the message said one thing and the actual cause was something else entirely.
