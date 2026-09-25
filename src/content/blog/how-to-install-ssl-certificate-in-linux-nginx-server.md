---
title: How to install SSL certificate in Red Hat Linux NGINX web server
description: Learn how to install and renew SSL certificates on a Red Hat Linux NGINX server, including certificate chains, backups, configuration, testing, and reloads.
date: 2026-09-08
author: BerojgarEngineer
image: /images/blog/ssl.jpg
tags: ["SSL certificate", "NGINX", "HTTPS", "TLS", "Red Hat Linux", "certificate chain", "SSL renewal", "certificate installation", "web server security", "Linux server administration", "server configuration", "SSL troubleshooting"]
categories: ["linux", "devops"]
---

Installing an SSL certificate sounds like a five minute job until you actually do it on a production server at 11 PM with a certificate that expires at midnight. Then you discover that the certificate authority sent you four separate files, NGINX refuses to start, and the browser still shows the old certificate even after a reload.

I have installed and renewed certificates on production NGINX servers many times as a support engineer, and almost every problem I have hit came down to one of three things: the certificate chain was assembled in the wrong order, the private key did not match the certificate, or something in front of NGINX was caching the old certificate.

This guide walks through the whole process on a Red Hat based Linux server (RHEL, CentOS, Rocky Linux, AlmaLinux) running NGINX. It covers commercial certificates from providers like DigiCert and Sectigo, and free certificates from Let's Encrypt using Certbot.

## What you will need before you start

- A Red Hat based server with NGINX already installed and serving the domain over HTTP
- Root or `sudo` access
- The certificate files from your provider, or port 80 reachable from the internet if you are using Certbot
- The private key.


## First, understand what your certificate provider sent you

Different certificate authorities ship their files differently. This is the single biggest source of confusion, so it is worth understanding what you actually received before you touch any configuration.

### DigiCert or Sectigo or any other providers


The best and most reliable way to generate the full chain certificate in my experience is with [keycdn certificate chain composer](https://tools.keycdn.com/certificate-chain).

Just put your domainname.crt certificate in that website and it will generate the chain for you to copy paste.

## Putting the files in place

Find where the existing certificates live rather than guessing. On a server that has been through a few administrators, certificates end up in surprising places, and the only reliable source of truth is what the configuration actually points at:

```bash
grep -r ssl_certificate /etc/nginx/
```

That will show you both `ssl_certificate` (the chain file) and `ssl_certificate_key` (the private key) with their full paths.

Upload the certificate and key into the server using WinSCP if you are on windows host and transferring to Linuxx host.


Always take a backup before making changes
```bash
cp /etc/nginx/conf.d/vhosts/ssl/crt2023.crt /etc/nginx/conf.d/vhosts/ssl/crt2023.crt.bak-dd-mm-yy
```

Certificate and key files should be readable only by root, since anyone who can read the private key can impersonate your site. The NGINX master process starts as root and reads them before dropping privileges, so restrictive permissions do not break anything:

```bash
chmod 600 /etc/nginx/conf.d/vhosts/ssl/*.key
chmod 644 /etc/nginx/conf.d/vhosts/ssl/*.crt
chown root:root /etc/nginx/conf.d/vhosts/ssl/*
```

## Reload NGINX

Always test the configuration before reloading. `nginx -t` parses the config, validates that the certificate files exist and are readable, and performs the key/certificate pairing check from Check 1:

```bash
nginx -t
```

Only once that returns `syntax is ok` and `test is successful` should you reload:

```bash
systemctl reload nginx
```

Use `reload`, not `restart`. A reload starts new worker processes with the new configuration and lets the old workers finish serving their in-flight requests before exiting. A restart drops every open connection. On a busy production server that difference is visible to users.

On servers where NGINX was compiled from source and has no systemd unit, the equivalent graceful reload is:

```bash
/usr/sbin/nginx -s reload
```

## Confirming the new certificate is live

```bash
curl -vI https://example.com
```

Note the explicit `https://`. Without a scheme, curl defaults to HTTP and you will see no TLS handshake at all — which looks like a failure but tells you nothing. The `-v` flag prints the handshake details(it stands for verbose), including the certificate the server actually presented and its validity dates.

## With Certbot

If you are using a Let's Encrypt certificate with Certbot, it is considerably easier, because the tool assembles and installs the chain for you.

Let's Encrypt certificates are free and issued automatically, which makes them a good fit for internal tools, side projects, and personal sites. The tradeoff is a 90 day validity period instead of a year, so automated renewal is not optional, it is the whole point. Commercial certificates from DigiCert or Sectigo are still common in banking and enterprise environments where a warranty and organisation validation are required.

### Installing Certbot

On RHEL 8, Rocky, Alma and RHEL 9, Certbot lives in EPEL:

```bash
dnf install -y epel-release
dnf install -y certbot python3-certbot-nginx
```

The plugin package is `python3-certbot-nginx`. There is no package called `certbot-nginx`.

### Issuing a certificate

```bash
certbot --nginx -d example.com
```

Certbot proves you control the domain by placing a file at `http://example.com/.well-known/acme-challenge/` and having Let's Encrypt fetch it. That means port 80 must be reachable from the internet and your DNS must point at this server. For domains that are not publicly reachable, use the DNS-01 challenge instead, which proves ownership through a TXT record and needs no inbound port at all.

The `--nginx` plugin edits your server blocks for you, adding the certificate paths and an HTTP to HTTPS redirect, then reloads NGINX itself. If you would rather it did not touch your configuration, use `certbot certonly --nginx -d example.com` and wire up the paths yourself — in which case point `ssl_certificate` at `fullchain.pem`, never `cert.pem`, since the latter is the leaf alone with no intermediates.

### Renewal

```bash
certbot renew --dry-run
```

Run the dry run first, so you find out about problems on your own schedule rather than on the day the certificate expires.


## Wrapping up

Hence this is how you install SSL certificates in linux server that uses NGINX. If you have any queries, or content suggestions, contact me https://berojgarengineer.com/contact/.

