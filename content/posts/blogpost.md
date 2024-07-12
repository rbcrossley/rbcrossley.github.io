---
title: "How to install SSL certificates in nginx web servers in Linux"
date: 1970-01-01
draft: true
ShowToc: true
---

# Objectives

- Learn how to install SSL certificates of various providers like digicert,sectigo in Linux using nginx web server.
- Learn how to install Letsencrypt SSL certificate.

# What's provided in premium SSL files?

1. `domain_name_certificate.crt`
2. `CA_Bundle.crt` or `intermediate.crt` and `root.crt`.
3. `usertrust`
4. `AAA`
5. `private_key.key`
   The goal is to generate a valid certificate by cryptographic algorithms.

# First understand the certificate provider.

## digicert certificate

`cat  domain_name_certificate.crt CA_Bundle.crt > crt2023.crt`
where,
`domain_name_certificate.crt` is the main certificate, the certificate that includes your domain name in it.
`CA_Bundle.crt` is combination of `intermediate`+`CA root`.

## sectigo certificate order

`final_cert`=`domain_name`.`sectigo`.`usertrust`.`AAA`

# after concatenating

- Copy and paste the certificates in `/etc/nginx/conf.d/vhosts/ssl` (or The location of earlier ssl certificate) To find `grep ssl_certificate *.conf`
- Take a backup of earlier certificate.
  Test the chain is successful or not.

```
openssl x509 -noout -modulus -in certificate.crt | openssl md5
```

Print the md5 hash of the Private Key modulus:

```
openssl rsa -noout -modulus -in private.key | openssl md5
```

the stdin output should match.

# Reload nginx

`systemctl reload nginx`

# Test if certificate is reflected(sometimes blocked by Web Application Firewall in Nginx)

```
curl domain_name_without_http -vI
```

Do it from inside the server to verify that it has been reflected inside the server. Next, try from outside the server, if it's not reflected there, it means Firewall is blocking the certificate.

# With certbot(letsencrypt)

## To install letsencrypt

`yum -y install certbot-nginx`

## For certificate installation

`certbot --nginx -d domain_name_without_https`

## For renewal

`certbot renew`

## To check if certbot is active

```
systemctl status certbot-nginx
```

Sometimes you need to restart nginx even if there is no systemd service for nginx

```
/usr/sbin/nginx -s reload
```

To find where `nginx` executable is, do

```
which nginx
```

References:
https://www.digicert.com/kb/csr-ssl-installation/nginx-openssl.htm
https://www.sectigo.com/resource-library/install-certificates-nginx-webserver

# Future plans for this article

- Installing SSL certificate in rancher server.
- Hardening SSL.
- In depth theory of how it works at byte level.
