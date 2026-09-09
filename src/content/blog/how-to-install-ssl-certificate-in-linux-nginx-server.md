---
title: How to install SSL certificate in Red Hat Linux NGINX web server
description: Learn how to install and renew SSL certificates on a Red Hat Linux NGINX server, including certificate chains, backups, configuration, testing, and reloads.
date: 2026-09-08
author: BerojgarEngineer
image: /images/blog/ssl.jpg
---

Installing an SSL certificate sounds like a five minute job until you actually do it on a production server at 11 PM with a certificate that expires at midnight. Then you discover that the certificate authority sent you four separate files, NGINX refuses to start, and the browser still shows the old certificate even after a reload.

I have installed and renewed certificates on production NGINX servers many times as a support engineer, and almost every problem I have hit came down to one of three things: the certificate chain was assembled in the wrong order, the private key did not match the certificate, or something in front of NGINX was caching the old certificate.

This guide walks through the whole process on a Red Hat based Linux server (RHEL, CentOS, Rocky Linux, AlmaLinux) running NGINX. It covers commercial certificates from providers like DigiCert and Sectigo, and free certificates from Let's Encrypt using Certbot.

## What you will need before you start

- A Red Hat based server with NGINX already installed and serving the domain over HTTP
- Root or `sudo` access
- The certificate files from your provider, or port 80 reachable from the internet if you are using Certbot
- The private key that was generated along with your certificate signing request (CSR)

One thing worth saying up front: **the private key never leaves your server**. If you have lost it, no certificate authority can give it back to you. You will have to generate a new CSR and reissue the certificate.

# First understand the certificate provider.

Different certificate authorities ship their files differently. This is the single biggest source of confusion, so it is worth understanding what you actually received before you touch any configuration.

Every HTTPS connection needs a complete **certificate chain**: your domain certificate, followed by one or more intermediate certificates, leading back to a root certificate that browsers already trust. If any link in that chain is missing, some browsers will still work (because they cache intermediates from other sites they have visited) while others show a security warning. This is why a certificate can look fine on your laptop and broken on a colleague's phone.

NGINX does not fetch missing intermediates for you. You have to concatenate the chain into a single file yourself, in the correct order: **leaf certificate first, then intermediates, then root**.

## digicert certificate

DigiCert typically sends you two files: your domain certificate and a CA bundle containing the intermediate and root certificates already stacked together. That makes assembly straightforward.

`cat  domain_name_certificate.crt CA_Bundle.crt > crt2023.crt`

domain_name_certificate.crt is the main certificate.
CA_Bundle.crt is combination of intermediate+CA root.

The order in that `cat` command matters. Your domain certificate must come first. If you reverse it, NGINX will start without complaining but clients will fail to validate the chain.

## sectigo certificate order

Sectigo sends the certificates as separate files instead of a pre-built bundle, so you have to stack them yourself in this exact order:

ssl certificate 
domain_name 
sectigo 
usertrust 
AAA

Read that list top to bottom as the order they should appear in your concatenated file. Your domain certificate goes first, then the Sectigo intermediate, then the USERTrust intermediate, then the AAA root. The equivalent command looks like this:

```bash
cat domain_name.crt SectigoRSA.crt USERTrust.crt AAA.crt > bundle.crt
```

If your provider is not on this list, the principle is identical. Open each file, look at the `Subject` and `Issuer` fields, and chain them so that each certificate's issuer is the subject of the file below it:

```bash
openssl x509 -in certificate.crt -noout -subject -issuer
```

# after concatenating

- Copy and paste the certificates in /etc/nginx/conf.d/vhosts/ssl (The location of earlier ssl certificate) To find `grep ssl_certificate *.conf`
- Take a backup of earlier certificate.

The `grep` above is worth doing rather than guessing. On a server that has been through a few administrators, certificates end up in surprising places, and the only reliable source of truth is what the configuration actually points at:

```bash
grep -r ssl_certificate /etc/nginx/
```

That will show you both `ssl_certificate` (the chain file) and `ssl_certificate_key` (the private key) with their full paths.

The backup step is not optional advice, it is the thing that lets you undo a bad renewal in ten seconds instead of thirty minutes:

```bash
cp /etc/nginx/conf.d/vhosts/ssl/crt2023.crt /etc/nginx/conf.d/vhosts/ssl/crt2023.crt.bak-$(date +%F)
```

Certificate and key files should be readable only by root, since anyone who can read the private key can impersonate your site:

```bash
chmod 600 /etc/nginx/conf.d/vhosts/ssl/*.key
chmod 644 /etc/nginx/conf.d/vhosts/ssl/*.crt
```

Test the chain is successful or not.

The check below compares the mathematical modulus of the certificate against the modulus of the private key. If they match, the key belongs to that certificate. If they do not, you have mixed up files from two different issuances, which is extremely common when you are renewing a certificate for the second or third year.

```
$ openssl x509 -noout -modulus -in certificate.crt | openssl md5

Print the md5 hash of the Private Key modulus:
$ openssl rsa -noout -modulus -in private.key | openssl md5

the stdin output should match
```

Do this **before** you reload NGINX. A mismatch caught here costs you nothing. A mismatch caught after a reload means your site is down while you work it out.

It is also worth confirming the chain itself is complete and that the expiry date is what you expect:

```bash
openssl verify -untrusted CA_Bundle.crt domain_name_certificate.crt
openssl x509 -in crt2023.crt -noout -dates
```

# Reload nginx

Always test the configuration before reloading. `nginx -t` parses the config and validates that the certificate files exist and are readable, so it catches typos in paths before they take the site down:

```bash
nginx -t
```

Only once that returns `syntax is ok` and `test is successful` should you reload:

`systemctl reload nginx`

Use `reload`, not `restart`. A reload starts new worker processes with the new configuration and lets the old workers finish serving their in-flight requests before exiting. A restart drops every open connection. On a busy production server that difference is visible to users.

# Test if certificate is reflected(sometimes blocked by Web Application Firewall in Nginx)

```
curl domain_name_without_http -vI
```

The `-v` flag makes curl print the TLS handshake details, including the certificate the server actually presented and its validity dates. That is what you want to see, not what you think you installed.

If the old certificate is still showing, the usual culprits, in the order I check them, are:

1. **A different server block is answering.** If the requested hostname does not match any `server_name`, NGINX serves the default server block and its certificate. Check with `nginx -T | grep -A5 server_name`.
2. **A load balancer or WAF is terminating TLS upstream.** In that case the certificate has to be installed there too, and NGINX behind it may never see HTTPS at all.
3. **A CDN is caching the connection.** Purge the cache or test the origin directly with `curl --resolve domain:443:origin_ip https://domain`.

To inspect the full chain as a client sees it:

```bash
openssl s_client -connect domain_name:443 -servername domain_name
```

The `-servername` flag sends the SNI header, which matters on any server hosting more than one HTTPS site. Without it you will get the default certificate and conclude, wrongly, that the installation failed.

# With certbot

If you are using letsencrypt certificate with certbot, it is a bit easy as it is just few commands.

Let's Encrypt certificates are free and issued automatically, which makes them a good fit for internal tools, side projects, and personal sites. The tradeoff is a 90 day validity period instead of a year, so automated renewal is not optional, it is the whole point. Commercial certificates from DigiCert or Sectigo are still common in banking and enterprise environments where a warranty and organisation validation are required.

## To install

`yum -y install certbot-nginx`

On newer Rocky Linux and RHEL 9 systems the package lives in EPEL and is named slightly differently:

```bash
dnf install -y epel-release
dnf install -y certbot python3-certbot-nginx
```

## For certificate

`certbot --nginx -d domain_name`

You will have to open port 80 for a moment to verify the ownership of domain and server.

That port 80 requirement is worth understanding rather than just working around. Certbot proves you control the domain by placing a file at `http://your-domain/.well-known/acme-challenge/` and having Let's Encrypt fetch it. If port 80 is closed, or if your DNS does not point at this server, validation fails. For domains that are not publicly reachable, use the DNS-01 challenge instead, which proves ownership through a TXT record.

The `--nginx` plugin edits your server blocks for you, adding the certificate paths and an HTTP to HTTPS redirect. If you would rather it did not touch your configuration, use `certbot certonly --nginx -d domain_name` and wire up the paths yourself.

## For renewal

`certbot renew`

Run this as a dry run first, so you find out about problems on your own schedule rather than on the day the certificate expires:

```bash
certbot renew --dry-run
```

Certbot only renews certificates within 30 days of expiry, so it is safe to run daily. Most packages install a systemd timer that does this automatically. Confirm yours is actually enabled, because a disabled timer is a silent failure that shows up as an outage three months later:

```bash
systemctl list-timers | grep certbot
```

Add a deploy hook so NGINX picks up the new certificate the moment it is issued:

```bash
certbot renew --deploy-hook "systemctl reload nginx"
```

## To check if certbot is active

```
systemctl status certbot-nginx
```

## To restart nginx if there is no nginx's systemctl service

```
/usr/sbin/nginx -s reload
```

You will hit this on servers where NGINX was compiled from source rather than installed from a package, so no systemd unit file exists. The `-s reload` signal does the same graceful reload that `systemctl reload nginx` triggers.

# Common errors and what they actually mean

These are the messages I have run into most often, and what each one is really telling you.

**`SSL_CTX_use_PrivateKey_file failed ... key values mismatch`**
The certificate and the private key are not a pair. Go back and run the two modulus checks above.

**`SSL: error:0B080074 ... certificate not verified`**
The chain is incomplete. You are missing an intermediate certificate, or you concatenated the files in the wrong order.

**`bind() to 0.0.0.0:443 failed (98: Address already in use)`**
Something else already holds port 443, often an old NGINX master process that did not exit. Find it with `ss -tlnp | grep 443`.

**`NET::ERR_CERT_COMMON_NAME_INVALID` in the browser**
The certificate is valid but was issued for a different hostname. Check the Subject Alternative Names: `openssl x509 -in certificate.crt -noout -text | grep -A1 "Subject Alternative Name"`.

**The certificate works on desktop but fails on Android**
Almost always a missing intermediate. Desktop browsers often have the intermediate cached from another site; mobile browsers frequently do not. Test with an external checker rather than your own machine.

# A renewal checklist worth keeping

Renewals happen once a year, which is exactly long enough to forget the details. This is the sequence I follow:

1. Note the current expiry date so you know your deadline: `openssl x509 -in current.crt -noout -enddate`
2. Back up the existing certificate, key, and NGINX configuration
3. Assemble the new chain in the correct order for your provider
4. Verify the certificate and key moduli match
5. Copy the new files into place and set permissions
6. Run `nginx -t`
7. Reload with `systemctl reload nginx`
8. Verify from outside the server with `openssl s_client` or `curl -vI`
9. Check the site in a browser you have not used recently, ideally on mobile

# Frequently asked questions

**Do I need to restart NGINX or is reload enough?**
Reload is enough and is the safer option. NGINX reads the certificate files fresh when workers reload, so there is no reason to drop live connections with a full restart.

**Why does my certificate work in Chrome but not on my phone?**
Nearly always a missing intermediate certificate in the chain. Desktop browsers may have it cached from elsewhere; mobile clients usually do not. Rebuild the bundle with all intermediates included.

**Can I use one certificate for multiple domains?**
Yes, either with a wildcard certificate (`*.example.com`, covering all first-level subdomains) or a SAN certificate listing several distinct domains. Both are configured in NGINX the same way as a single-domain certificate.

**How do I check when my certificate expires without logging into the server?**
`echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates`

**Should I use Let's Encrypt or a paid certificate?**
Technically the encryption is identical. Let's Encrypt is right for most personal sites, internal tools, and small projects. Paid certificates with organisation validation are usually a compliance requirement rather than a technical one, which is why you still see them throughout the banking sector.

# Wrapping up

Most SSL installation problems are not really about SSL. They come down to chain order, a key and certificate that do not belong together, or something between the client and NGINX that you forgot was there. If you get into the habit of verifying the moduli before reloading and testing from outside the server afterwards, certificate renewal becomes a genuinely boring ten minute task instead of the thing you dread every year.

Keep a note of your expiry dates somewhere you will actually look, and if you are running Let's Encrypt, verify the renewal timer is enabled today rather than finding out in three months.
