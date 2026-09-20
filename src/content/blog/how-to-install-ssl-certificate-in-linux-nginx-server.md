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
- The private key that was generated along with your certificate signing request (CSR)

One thing worth saying up front: **the private key never leaves your server**. 


## First, understand what your certificate provider sent you

Different certificate authorities ship their files differently. This is the single biggest source of confusion, so it is worth understanding what you actually received before you touch any configuration.

Every HTTPS connection needs a complete **certificate chain**: your domain certificate, followed by one or more intermediate certificates, leading back to a root certificate that the client already trusts. If any link in that chain is missing, some clients will still work (because they have the intermediate cached from another site, or because they fetch it themselves) while others show a security warning. This is why a certificate can look fine on your laptop and broken on a colleague's phone.

NGINX does not fetch missing intermediates for you. You have to concatenate the chain into a single file yourself.

Two rules govern that file, and they are not equally strict:

1. **The leaf certificate must come first.** This one is absolute. NGINX treats the first certificate in the file as the end-entity certificate and presents it as such. Get this wrong and the server presents an intermediate as though it were your site's certificate.
2. **Intermediates follow, ordered from the one that issued your leaf upwards.** This is what the TLS spec asks for, and what you should do. In practice most modern clients — OpenSSL, NSS, GnuTLS — will reorder intermediates themselves if you get it wrong, so a misordered chain often appears to work. Some embedded and older stacks will not. Order them correctly rather than relying on client leniency.

**Do not include the root certificate.** This is a common habit and it is wrong. The client already has the root in its trust store; if it does not, sending your own copy does not help, because a root is trusted by virtue of being in the store, not by being presented. All an included root does is add a kilobyte or so to every single handshake. Chain your file from the leaf up to, but not including, the root.

### DigiCert

DigiCert typically sends you two files: your domain certificate and a CA bundle containing the intermediates already stacked together. That makes assembly straightforward.

```bash
cat domain_name_certificate.crt CA_Bundle.crt > crt2023.crt
```

The order in that `cat` command matters. Your domain certificate must come first.

Check whether the bundle DigiCert sent includes the root, and strip it if so. You can see what is in a bundle with:

```bash
openssl crl2pkcs7 -nocrl -certfile CA_Bundle.crt \
  | openssl pkcs7 -print_certs -noout
```

A certificate whose `subject` and `issuer` are identical is self-signed — that is the root, and it does not belong in the file.

### Sectigo

Sectigo sends the certificates as separate files instead of a pre-built bundle, so you have to stack them yourself. The chain, from leaf upwards, is:

```
domain_name.crt      (your certificate)
SectigoRSA.crt       (intermediate)
USERTrust.crt        (intermediate)
AAA.crt              (root — do not include)
```

So the file you actually build stops one short of the list:

```bash
cat domain_name.crt SectigoRSA.crt USERTrust.crt > bundle.crt
```

You will see plenty of guides that include `AAA.crt` at the end. That is a leftover from the era of cross-signing for very old Android devices, and for a certificate issued today it is dead weight. Leave it out.

If your provider is not on this list, the principle is identical. Open each file, look at the `Subject` and `Issuer` fields, and chain them so that each certificate's issuer is the subject of the file below it:

```bash
openssl x509 -in certificate.crt -noout -subject -issuer
```

## Putting the files in place

Find where the existing certificates live rather than guessing. On a server that has been through a few administrators, certificates end up in surprising places, and the only reliable source of truth is what the configuration actually points at:

```bash
grep -r ssl_certificate /etc/nginx/
```

That will show you both `ssl_certificate` (the chain file) and `ssl_certificate_key` (the private key) with their full paths.

Transfer the new files with `scp` or `rsync`. Do not copy and paste certificate contents into a terminal — it is a genuinely common way to corrupt a file, because terminals and editors mangle trailing whitespace, wrap long base64 lines, and convert line endings. A certificate that fails to parse for no visible reason is usually one that was pasted.

The backup step is not optional advice, it is the thing that lets you undo a bad renewal in ten seconds instead of thirty minutes:

```bash
cp /etc/nginx/conf.d/vhosts/ssl/crt2023.crt \
   /etc/nginx/conf.d/vhosts/ssl/crt2023.crt.bak-$(date +%F)
```

Certificate and key files should be readable only by root, since anyone who can read the private key can impersonate your site. The NGINX master process starts as root and reads them before dropping privileges, so restrictive permissions do not break anything:

```bash
chmod 600 /etc/nginx/conf.d/vhosts/ssl/*.key
chmod 644 /etc/nginx/conf.d/vhosts/ssl/*.crt
chown root:root /etc/nginx/conf.d/vhosts/ssl/*
```

## Check 1: does the private key belong to this certificate?

This check is worth doing, but be clear about what it proves. It confirms that the public key inside your leaf certificate corresponds to your private key — in other words, that these two files came from the same issuance. **It tells you nothing whatsoever about the certificate chain.** A certificate can pass this check and still be missing every intermediate, be expired, or be issued for the wrong hostname.

You will see this check written with `openssl rsa -modulus`. Avoid that form: it fails on ECDSA and Ed25519 keys, which are increasingly common. Compare the public keys instead, which works for every key type:

```bash
openssl x509 -in certificate.crt -noout -pubkey | openssl sha256
openssl pkey -in private.key -pubout | openssl sha256
```

The two digests must be identical. If they are not, you have mixed up files from two different issuances — which happens constantly when you are renewing for the second or third year and the previous year's files are still sitting in the same directory.

It is worth knowing that `nginx -t` performs this same comparison when it loads the SSL context, and will refuse the configuration with `key values mismatch` if it fails. So this is really a pre-flight convenience: it lets you sort out which key goes with which certificate *before* you edit any configuration, rather than finding out from a failed config test.

## Check 2: verifying the chain properly

This is the check the previous one is often mistaken for. It is a separate operation and it answers a different question.

Start with a trust file containing **only root certificates**. This detail is the whole point of the exercise. If OpenSSL is allowed to consult a store that happens to contain intermediates, or to fall back to the system directory, it will quietly build a valid chain using certificates your server never sends — and you will get a clean pass on a chain that breaks for real clients. On Red Hat systems the system bundle is roots-only and works fine:

```bash
ROOTS=/etc/pki/tls/certs/ca-bundle.crt
```

If you want certainty about what is in it, use Mozilla's roots-only bundle as published by the curl project:

```bash
curl -o /tmp/roots.pem https://curl.se/ca/cacert.pem
ROOTS=/tmp/roots.pem
```

### Verifying the file on disk

Separate your intermediates into their own file, then verify the leaf against the roots using only those intermediates as untrusted input:

```bash
openssl verify \
  -CAfile "$ROOTS" \
  -no-CApath -no-CAstore \
  -untrusted intermediates.crt \
  -purpose sslserver \
  -show_chain \
  domain_name.crt
```

`-no-CApath` and `-no-CAstore` are what stop OpenSSL from consulting anything except the file you named. `-purpose sslserver` checks that the certificate's extended key usage actually permits server authentication. `-show_chain` prints the path it built, so you can see which certificates were used and confirm the chain ends at a root and not somewhere in the middle.

A note on versions: `-no-CAstore` was added in OpenSSL 3.0. On RHEL 8 and other 1.1.1 systems, drop it and keep `-no-CApath`.

### Verifying what the server actually serves

The disk check validates the files. It does not validate what comes out of the socket — and those diverge more often than you would like, because of a config pointing at a stale path, a second server block answering, or a load balancer in front. This is the check that matters:

```bash
openssl s_client -connect example.com:443 \
  -servername example.com \
  -verify_hostname example.com \
  -verify_return_error \
  -CAfile "$ROOTS" \
  -no-CApath -no-CAstore \
  -showcerts </dev/null
```

Each flag is doing real work:

- `-servername` sends SNI. Without it, a server hosting more than one HTTPS site hands you the default certificate and you draw the wrong conclusion.
- `-verify_hostname` checks the name against the Subject Alternative Names. Plain `s_client` does not do this by default — it will happily report `Verify return code: 0 (ok)` for a valid certificate issued to an entirely different domain.
- `-verify_return_error` makes a verification failure a non-zero exit instead of a line of output you might skim past. This is what makes the command usable in a script.
- `-CAfile` with `-no-CApath -no-CAstore` is the strictness that makes the result meaningful, as described above.
- `</dev/null` closes stdin so the command exits instead of hanging.

You want `Verify return code: 0 (ok)`. Under `Certificate chain` you should see your leaf at depth 0 and one or more intermediates above it, with each entry's issuer (`i:`) matching the subject (`s:`) of the entry below. The root should not appear.

### What this does and does not prove

This is the strongest check you can run from a shell, and it is worth being precise about its scope. It proves that **this node, at this moment, serves a chain that builds to a public root without outside help, for a hostname that matches.** If an intermediate is missing or the leaf is not first, this fails. That is a real guarantee, and it is the one most people think the modulus check was giving them.

It does not prove the certificate works everywhere, and no shell command can:

- **Trust stores differ.** Android, iOS, Windows, Java, and older embedded devices all ship different root sets. A chain that builds against Mozilla's roots may not build against a 2019 Android handset's.
- **Some clients repair broken chains silently.** Windows and Firefox fetch or preload missing intermediates. A chain that fails here may appear fine in those browsers — and a chain that works in them may fail for curl, Java, and Go.
- **Certificate Transparency is not checked.** Chrome requires SCTs. A certificate can pass every OpenSSL check and still be rejected by Chrome.
- **Revocation is not checked** by default.
- **You tested one node.** Behind a load balancer, the other backends may still be serving the old bundle. Test each one directly with `-connect <backend_ip>:443 -servername example.com`.

For the parts OpenSSL cannot cover, use an external checker that tests against several client trust stores at once — SSL Labs (`ssllabs.com/ssltest`) for a public site, or `testssl.sh` for an internal one. Treat those as the complement to the command above, not a replacement for it.

It is also worth confirming expiry while you are here:

```bash
openssl x509 -in crt2023.crt -noout -dates
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

Note the explicit `https://`. Without a scheme, curl defaults to HTTP and you will see no TLS handshake at all — which looks like a failure but tells you nothing. The `-v` flag prints the handshake details, including the certificate the server actually presented and its validity dates.

If the old certificate is still showing, the usual culprits, in the order I check them, are:

1. **A different server block is answering.** If the requested hostname does not match any `server_name`, NGINX serves the default server block and its certificate. Check with `nginx -T | grep -A5 server_name`.
2. **A load balancer or WAF is terminating TLS upstream.** In that case the certificate has to be installed there too, and NGINX behind it may never see HTTPS at all.
3. **A CDN is caching the connection.** Purge the cache or test the origin directly with `curl --resolve example.com:443:ORIGIN_IP https://example.com`.

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

Certbot only renews certificates within 30 days of expiry, so it is safe to run daily, and the packages install a systemd timer that does exactly that. Confirm yours is actually enabled, because a disabled timer is a silent failure that shows up as an outage three months later:

```bash
systemctl list-timers --all | grep -i certbot
```

There is no `certbot-nginx` service to check the status of — you will see a timer, typically `certbot-renew.timer` on EPEL packages or `snap.certbot.renew.timer` on snap installs. To see what Certbot is actually managing and when each certificate expires:

```bash
certbot certificates
```

If you are not using the `--nginx` installer plugin, NGINX needs to be reloaded after a renewal. The durable way to arrange that is a deploy hook script, which Certbot runs only when a certificate is actually renewed:

```bash
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh <<'EOF'
#!/bin/sh
systemctl reload nginx
EOF
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

Anything in that directory applies to every certificate automatically. Passing `--deploy-hook` on a `certbot renew` command line only affects that one run, which is why hooks configured that way have a habit of disappearing.

## Common errors and what they actually mean

**`SSL_CTX_use_PrivateKey_file(...) failed (SSL: error:0B080074:x509 certificate routines:X509_check_private_key:key values mismatch)`**

The certificate and the private key are not a pair. This error code refers specifically to the key/certificate mismatch — it is not a chain problem, despite how often it gets described as one. Run the two public key digests from Check 1.

**`unable to get local issuer certificate` (verify error 20), or `unable to verify the first certificate` (verify error 21)**

The chain is incomplete. Your server is not sending an intermediate the client needs. Rebuild the bundle with all intermediates included, in leaf-first order. Error 20 means the issuer of some certificate in the chain could not be found; error 21 means the leaf itself could not be verified.

**`self signed certificate in certificate chain` (verify error 19)**

Usually you have included the root in your bundle when the client does not have that root in its store. Remove the root from the file and check that the chain terminates at a root that is actually trusted.

**`bind() to 0.0.0.0:443 failed (98: Address already in use)`**

Something else already holds port 443, often an old NGINX master process that did not exit. Find it with `ss -tlnp | grep 443`.

**`NET::ERR_CERT_COMMON_NAME_INVALID` in the browser**

The certificate is valid but was issued for a different hostname. Check the Subject Alternative Names:

```bash
openssl x509 -in certificate.crt -noout -ext subjectAltName
```

**The certificate works on desktop but fails on Android or in Java**

Almost always a missing intermediate. Desktop browsers frequently fetch or cache intermediates; Android, Java and Go do not. Run the strict `s_client` check from Check 2 — this is precisely the failure it is designed to catch.

## A renewal checklist worth keeping

Renewals happen once a year, which is exactly long enough to forget the details. This is the sequence I follow:

1. Note the current expiry date so you know your deadline: `openssl x509 -in current.crt -noout -enddate`
2. Back up the existing certificate, key, and NGINX configuration
3. Assemble the new chain: leaf first, intermediates above it, no root
4. Confirm the certificate and key are a pair (Check 1)
5. Verify the assembled chain against a roots-only store (Check 2, disk)
6. Copy the new files into place with `scp` and set permissions
7. Run `nginx -t`
8. Reload with `systemctl reload nginx`
9. Verify from outside the server with the strict `s_client` command (Check 2, live) — and against every backend node if you are behind a load balancer
10. Run an external checker such as SSL Labs or `testssl.sh` for trust stores OpenSSL cannot represent

## Frequently asked questions

**Do I need to restart NGINX or is reload enough?**

Reload is enough and is the safer option. NGINX reads the certificate files fresh when workers reload, so there is no reason to drop live connections with a full restart.

**Does a matching certificate and key mean my chain is correct?**

No, and this is worth being emphatic about because the two checks are widely conflated. Comparing the certificate's public key against the private key proves only that those two files belong together. It says nothing about intermediates, ordering, expiry, hostname, or trust. Use the `s_client` verification in Check 2 for the chain.

**Is there a single command that conclusively proves my chain is correct?**

Not in the absolute sense. The strict `s_client` check in Check 2 is deterministic for what it covers — it will fail if an intermediate is missing or the leaf is not first — but it verifies one node, against one trust store, at one moment. It cannot speak for other clients' root stores, Certificate Transparency, revocation, or other backends behind your load balancer. Pair it with an external multi-client checker and you have covered the ground that can be covered.

**Why does my certificate work in Chrome but not on my phone?**

Nearly always a missing intermediate. Some desktop browsers fetch missing intermediates over AIA or ship them preloaded; mobile clients generally do not. Rebuild the bundle with all intermediates included.

**Should I include the root certificate in my bundle?**

No. The client trusts roots because they are in its trust store, not because you sent one. Including it adds bytes to every handshake and achieves nothing.

**Can I use one certificate for multiple domains?**

Yes, either with a wildcard certificate (`*.example.com`, covering all first-level subdomains) or a SAN certificate listing several distinct domains. Both are configured in NGINX the same way as a single-domain certificate.

**How do I check when my certificate expires without logging into the server?**

```bash
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -dates
```

**Should I use Let's Encrypt or a paid certificate?**

Technically the encryption is identical. Let's Encrypt is right for most personal sites, internal tools, and small projects. Paid certificates with organisation validation are usually a compliance requirement rather than a technical one, which is why you still see them throughout the banking sector.

## Wrapping up

Most SSL installation problems are not really about SSL. They come down to chain order, a key and certificate that do not belong together, or something between the client and NGINX that you forgot was there.

The single most useful habit is keeping those first two apart in your head. Comparing the certificate's public key against the private key tells you the files are a pair, and nothing more. Verifying the chain means checking what the server actually serves, against a trust store that contains only roots, with every fallback disabled — because anything less permissive will quietly fix a broken chain for you and tell you it is fine.

Keep a note of your expiry dates somewhere you will actually look, and if you are running Let's Encrypt, verify the renewal timer is enabled today rather than finding out in three months.