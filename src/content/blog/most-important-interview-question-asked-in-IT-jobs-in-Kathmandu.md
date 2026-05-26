---
title: Most important interview questions asked in IT jobs in Kathmandu Valley
description: The end to end guide to IT interviews in Nepal
date: 2026-05-29
author: cst
image: /images/blog/interview.png
---

I have interviewed in many places. Based on my experience I have provided some popular interview questions asked in IT jobs in Kathmandu Valley. Most of these were for fresher IT engineer role like Support Engineer, System Engineer, System Admin, Network Admin etc. 

The questions can be categorized into two parts:

- technical
- behavioral

In technical part, you are asked questions about the job itself. It is better to read the published job description properly before going for the job. This list is for pure freshers. I do not have experience interviewing for mid or senior level roles so cannot say much regarding that. 

In behavioral part, you are asked non-technical questions. Something like "Tell me about the time when you faced a critical issue?".

I will just provide the topics that are usually asked in technical portion. Rest you can research yourself.

# Technical

- OSI Model layers and their functions
- TCP/IP model vs OSI model
- IP addressing (IPv4 classes, subnetting, CIDR notation)
- Private vs public IP addresses
- MAC address vs IP address
- ARP (Address Resolution Protocol) working
- NAT (Network Address Translation) types (SNAT, DNAT and when to use what)
- DHCP working process (DORA — Discover, Offer, Request, Acknowledge)
- DHCP lease, scope, and reservation
- DNS working process (recursive vs iterative resolution) (Self hosted DNS troubleshooting questions are important)
- DNS record types (A, AAAA, CNAME, MX, PTR, NS, SOA, TXT)
- DNS zones (forward vs reverse lookup)
- HTTP vs HTTPS difference
- SSL/TLS handshake process
- Port numbers of common protocols
  - SSH: 22
  - DNS: 53
  - HTTP: 80
  - HTTPS: 443
  - DHCP: 67/68
  - FTP: 20/21
  - SMTP: 25
  - RDP: 3389
  - Telnet: 23
- TCP vs UDP difference and use cases
- Ping, traceroute/tracert, nslookup, ipconfig/ifconfig, netstat usage
- Proxy server concept and types (Reverse proxy important)
- Load balancer concept (HAProxy practical demonstration)
- Bandwidth vs throughput vs latency

- VLAN concept and purpose
- Types of VLAN
  - Default VLAN
  - Data VLAN
  - Voice VLAN
  - Management VLAN
  - Native VLAN
- VLAN tagging (802.1Q)
- Trunk port vs access port
- Inter-VLAN routing
- VERY IMPORTANT: VLAN Trunking protocol
- VERY IMPORTANT: Spanning Tree Protocol (STP) basics
- Switch vs hub vs router

- VPN concept and purpose
- Types of VPN
  - Site-to-Site VPN
  - Remote Access VPN
  - Client-to-Site VPN
  - MPLS VPN
- IPSec VPN — working mechanism (tunnel vs transport mode)
- SSL VPN vs IPSec VPN difference
- IKE (Internet Key Exchange) phases
- VPN tunneling protocols (L2TP, PPTP, OpenVPN, WireGuard)

- Firewall types (packet filter, stateful, application layer)
  - Firewall troubleshooting questions are also very important. I do not remember the exact question.
- IDS vs IPS
- DMZ (Demilitarized Zone) concept
- ACL (Access Control List) concept
- Authentication vs authorization vs accounting (AAA)
- MFA (Multi-Factor Authentication)
- Public key vs private key (asymmetric encryption)
- Symmetric vs asymmetric encryption
- Hashing vs encryption difference
- Common attack types (DDoS, MITM, phishing, brute force, SQL injection)
- Password policy best practices
- Principle of least privilege (usually asked to name the principle used while providing access)

- Active Directory concept and purpose
- Domain, forest, tree structure
- Domain controller role
- AD DS (Active Directory Domain Services)
- LDAP basics
- Group Policy Object (GPO) — purpose and application
- FSMO roles (5 roles — names and functions)
- User account management in AD
- OU (Organizational Unit) concept
- AD replication concept
- Trust relationships in AD
- DNS integration with Active Directory
- NTDS.dit database
- Authoritative vs non-authoritative AD restore
- Windows Server roles — DNS, DHCP, File Server, Print Server, IIS
- Server Core vs Desktop Experience
- Server Manager basics
- Event Viewer — log types (Application, Security, System)
- Windows boot process
- BSOD (Blue Screen of Death) — common causes
- Remote Desktop Protocol (RDP)
- SMB (Server Message Block) protocol
- Network drive mapping
- RAID levels (0, 1, 5, 6, 10) — differences and use cases
- Hardware RAID vs Software RAID
- UPS and its importance for servers

- Linux file system hierarchy (/, /etc, /var, /home, /opt, /tmp, /bin, /sbin)
- Basic Linux commands (ls, cd, cp, mv, rm, mkdir, chmod, chown, ps, top, df, du, find, grep, tar, curl, wget)
- File permissions (rwx, octal notation, chmod, chown)
- User management (useradd, passwd, sudo, /etc/passwd, /etc/shadow)
- Process management (ps, kill, jobs, bg, fg, systemctl, service)
- Package management (apt, yum/dnf, rpm)
- Crontab — scheduling jobs
- SSH configuration and key-based authentication
- Log files location (/var/log/syslog, /var/log/auth.log, /var/log/messages)
- Firewall in Linux (iptables, ufw, firewalld)
- Disk management (fdisk, lsblk, mount, fstab)
- Network configuration (ip addr, nmcli, /etc/network/interfaces)
- Swap space concept

- Virtualization concept and benefits
- Hypervisor types (Type 1 vs Type 2)
- VMware ESXi basics
- Hyper-V basics
- vMotion / Live Migration concept
- Snapshot concept
- VERY IMPORTANT (especially if the role leans towards devops): VM vs container difference
- Resource allocation (vCPU, RAM, storage for VMs)

- Server form factors (rack, tower, blade)
- Server hardware components (CPU, RAM types, NIC, HBA, RAID controller)
- BIOS vs UEFI
- POST (Power-On Self-Test) process
- Storage types — HDD, SSD, NVMe, SAN, NAS
- Fiber Channel vs iSCSI
- RAID concept and levels (0, 1, 5, 6, 10)
- Hot spare in RAID
- UPS types (offline, line-interactive, online double conversion)
- PDU (Power Distribution Unit)
- Cable types (Cat5, Cat5e, Cat6, Cat6a, fiber)
- SFP / SFP+ modules
- Structured cabling standards
- Data center tiers (Tier 1 to Tier 4)

- ITIL framework basics (Incident, Problem, Change management)
- Ticketing system concepts (JIRA, Zendesk, ServiceNow)
- SLA (Service Level Agreement) concept
- Escalation process
- Troubleshooting methodology (gather info → reproduce → isolate → resolve → document)
- Remote troubleshooting tools (TeamViewer, AnyDesk, RDP)
- Network troubleshooting commands (ping, tracert, netstat, nslookup, ipconfig)
- Helpdesk L1/L2/L3 support tiers
- ITIL incident vs problem vs change vs request
- Documentation and knowledge base importance
- Business continuity vs disaster recovery
- RTO (Recovery Time Objective) vs RPO (Recovery Point Objective)

- DevOps concept and culture (Dev + Ops collaboration)
- CI/CD pipeline concept (Continuous Integration, Continuous Delivery, Continuous Deployment)
- Git fundamentals (clone, commit, push, pull, branch, merge, rebase, pull request)
- Git branching strategies (GitFlow, trunk-based)
- Jenkins basics — pipeline, stages, agents
- GitHub Actions concept
- Docker fundamentals
  - Container vs VM
  - Image vs container
  - Dockerfile basics (FROM, RUN, COPY, CMD, EXPOSE, ENV)
  - Docker Hub / registry
  - Docker volumes and networking
  - docker-compose concept
- Kubernetes basics
  - Pod, Node, Cluster
  - Deployment, Service, Namespace
  - kubectl basics
- Infrastructure as Code (IaC) concept
- Ansible basics (playbook, inventory, task, role)
- Terraform basics (provider, resource, state, plan, apply)
- Cloud basics — AWS, Azure, GCP (IaaS, PaaS, SaaS difference)
- AWS core services (EC2, S3, VPC, IAM, Route53, RDS, CloudWatch)
- Monitoring concepts (Prometheus, Grafana, ELK stack — basics)
- Bash scripting basics (variables, loops, conditionals, functions)
- Python scripting basics for automation
- Microservices vs monolithic architecture

- VERY IMPORTANT ADVANCED TOPIC: Redis / caching concept
- Transaction processing and ACID properties
- SSL certificate management

- OSI vs TCP/IP model comparison
- Subnetting and CIDR calculation
- Difference between router, switch, hub, bridge, gateway
- IP address classes and ranges
- Loopback address purpose (127.0.0.1)
- Broadcast vs unicast vs multicast
- ICMP protocol and ping working
- ARP spoofing concept
- Difference between TCP 3-way handshake and 4-way termination
- What happens when you load a web page in browser? (Very important for internships)

