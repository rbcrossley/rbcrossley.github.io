---
title: My notes on NGINX web servers
description: Practical NGINX notes for Rocky Linux and Red Hat distributions, covering installation, server blocks, SSL, reverse proxies, troubleshooting, and daily work.
date: 2026-09-08
author: BerojgarEngineer
image: /images/blog/nginx.jpg
---

NGINX now sits in front of a large share of the world's busiest websites, and in Nepal you will find it in front of almost every serious deployment: banking portals, internal applications, Kubernetes ingress controllers, and just about every VPS anyone has set up in the last decade.

What makes it worth learning properly rather than copying configuration snippets from Stack Overflow is that NGINX is not really one thing. It is a web server, a reverse proxy, a load balancer, an SSL termination point and a cache, and the same configuration file syntax expresses all of them. Once the mental model clicks, all five stop feeling like separate tools.

These are my working notes from studying NGINX and from using it daily as a production support engineer. Every lab below is one I built and ran myself on virtual machines, and the log output and command results are copied from those runs rather than invented.

**How to use this page:** work through it in order if you are learning NGINX from scratch. The reverse proxy and load balancer labs build on the server block configuration that comes before them. If you are here for a specific answer, the headings are deliberately literal so you can jump straight to what you need.

# Infrastructure required

I am using Rocky Linux 9, you can use any linux distributions and the result will be same. But I would recommend choosing any Red Hat based distribution. Make sure to have at least 3 servers ready. Example:

```
192.168.1.3
192.168.1.4
```

Three servers sounds like a lot for learning a web server, but the reverse proxy and load balancer labs later on genuinely need them: one machine acting as the proxy and at least two behind it. Virtual machines are fine, and 1 GB of RAM each is plenty. VirtualBox, VMware Workstation or a few cheap VPS instances all work equally well.

If you are running this in a homelab, put all three on the same bridged network so they can reach each other by IP. Most of the confusion in the reverse proxy lab comes down to machines that cannot actually see one another.

The IPs I use throughout are:

```
192.168.1.3 → reverse proxy / load balancer
192.168.1.2 → backend application server
192.168.1.4 → second backend / authentication server
```

Substitute your own and keep them consistent, because the configuration files reference them directly.

# Installing NGINX

## Using `yum` package manager

```
yum install nginx -y
```

This pulls the version your distribution packages, which is stable and receives security backports but is usually a release or two behind. For most purposes that is exactly what you want.

## Using `rpm`

```
yum -y install wget
wget https://nginx.org/packages/rhel/9/x86_64/RPMS/nginx-1.20.2-1.el9.ngx.x86_64.rpm
yum install nginx*.rpm
```

Installing directly from nginx.org gets you a newer version, which matters if you need a feature the distribution package predates, HTTP/3 support being the common example. The tradeoff is that you are now responsible for tracking updates yourself.

**Start and Enable NGINX**

```
systemctl start nginx && systemctl enable nginx
```

`start` runs it now, `enable` makes it start on boot. Forgetting the second half is a mistake you discover after the next reboot, which is always at an inconvenient time.

**Check `nginx` version with other details**

```
nginx -V
```

The capital `V` is far more useful than it looks. It prints the full list of compile-time flags and modules the binary was built with. Before you spend an hour debugging why a directive is being ignored, check whether the module providing it is actually compiled in. `nginx -V 2>&1 | grep -o with-http_ssl_module` is the quick version of that check.

**Only check the `nginx` version**

```
nginx -v
```

# HTTP Protocol

You cannot configure a web server well without knowing what it is serving. Most NGINX configuration is a direct expression of HTTP concepts, so the sections below are the parts of the protocol that come up repeatedly in real work.

## HTTP GET

GET method is used to fetch the information which is specified in the request URI.

**Handwriting GET**

You can use `telnet` to send a GET request to a non-HTTPS website. In practice, `curl` is the flexible way to send GET requests, but typing one by hand once is genuinely worth doing, because it shows you that HTTP is just text over a TCP connection with no magic in it.

Plain HTTP sites are hard to find now, which is good news for the web and mildly inconvenient for this demonstration. The example below is from Zeal Vora's NGINX course on Udemy.

```
telnet dexter.kplabs.in 80
Don't press the escape character. Type as it is here.
GET /sample.html HTTP/1.1
Host: dexter.kplabs.in
Press Enter Twice

Output is shown in screen.
HTTP/1.1 200 OK
Server: nginx/1.20.1
Date: Wed, 16 Aug 2023 14:02:05 GMT
Content-Type: text/html
Content-Length: 76
Last-Modified: Wed, 18 Oct 2017 05:19:43 GMT
Connection: keep-alive
ETag: "59e6e46f-4c"
Accept-Ranges: bytes

This is sample file.
Secially designed for your handwritten GET requests ;)
```

The `Host:` header is the interesting part of that exchange. It is what makes name-based virtual hosting possible: one IP address, one port, many websites, distinguished only by which hostname the client asked for. That is exactly the mechanism the server blocks section below relies on, and it is why HTTP/1.1 made the header mandatory.

`curl` with the `-I` option shows the response headers only.

```
[root@localhost ~]# curl -I  dexter.kplabs.in/partial.txt
HTTP/1.1 200 OK
Server: nginx/1.20.1
Date: Wed, 16 Aug 2023 14:12:12 GMT
Content-Type: text/plain
Content-Length: 292
Last-Modified: Wed, 18 Oct 2017 05:58:53 GMT
Connection: keep-alive
ETag: "59e6ed9d-124"
Accept-Ranges: bytes
```

`curl -I` sends a HEAD request rather than a GET, so you get the headers without downloading the body. On a large file that difference matters. This is my most-used command for checking whether a deployment actually went out, since the `Last-Modified` and `ETag` headers tell you which version is being served.

### Conditional GET

Only show the website if some condition is met. Use the `--header` option to put the conditions.

```cmd
curl --header "If-Modified-Since:Wed, 18 Oct 2017 05:19:43 GMT" dexter.kplabs.in/sample.html
```

If the file wasn't modified since 18 October 2017, we'll get a `304 Not Modified` HTTP response. Note that it's not like we don't get anything.

Conditional requests are the foundation of browser caching. The browser holds a copy along with its `ETag`, asks the server whether anything changed, and on a `304` reuses what it already has. Saving the round trip of the body is the entire point, and it is why the `ETag` and `Last-Modified` headers exist.

## HTTP POST

It is used to send some data to be processed in some way.

One correction worth making to a common misconception: a Google search actually uses GET, not POST, which is why you can bookmark and share a results URL. The rule of thumb is that GET should be safe and repeatable with no side effects, while POST changes something on the server. Submitting a login form or placing an order is POST; searching and filtering are GET.

## HTTP TRACE

It will echo the content of the request back to the requestor (except credentials like passwords, cookies etc). It is useful to identify any changes to the request by any intermediate proxies, as proxies manipulate headers.

It doesn't contain a body. It's used for debugging purposes.

TRACE is disabled on essentially every production server, because it was the basis of a cross-site tracing attack that could expose cookies otherwise protected by the `HttpOnly` flag. If a security scan flags TRACE as enabled, that is a finding to act on.

## HTTP OPTION

This will specify the available communication options with which a client can communicate with a server.

```
Syntax:
OPTIONS /index.html HTTP/1.1
Invocation:
curl -X OPTIONS http://example.org -i

HTTP/1.1 200 OK
Allow: OPTIONS, GET, HEAD, POST
Cache-Control: max-age=604800
Content-Type: text/html; charset=UTF-8
Date: Thu, 17 Aug 2023 11:18:11 GMT
Expires: Thu, 24 Aug 2023 11:18:11 GMT
Server: EOS (vny/0452)
Content-Length: 0
```

NGINX returns 405 Method Not Allowed for OPTIONS on static content by default.

That default becomes a real problem the first time you put an API behind NGINX and a browser-based frontend calls it from another origin. The browser sends an OPTIONS preflight request first, NGINX rejects it, and the actual request never happens. The fix is to answer preflights explicitly:

```nginx
location /api/ {
    if ($request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin "https://your-frontend.com";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        return 204;
    }
    proxy_pass http://backend;
}
```

This is one of the most common "it works in Postman but not in the browser" problems, and the answer is almost always CORS preflight.

## HTTP Response Status Code

There are various Response Status Codes available:

- 100-199 — Informational Status Codes
- 200-299 — Success Status Codes
- 300-399 — Redirection Status Codes
- 400-499 — Client Error Status Codes
- 500-599 — Server Error Status Codes

The single most useful thing this classification gives you is the 4xx/5xx split. A 4xx means the client sent something wrong; a 5xx means the server failed. When an incident comes in, that division tells you immediately whether to look at the application or at the request, and it is the first thing I check in the access log.

### 200 status code

200 status code indicates that the action received by the client is:

- Received, Understood, Accepted & Processed

Example: 200 OK
206 Partial Content

`206 Partial Content` is what makes resumable downloads and video seeking work. The client sends a `Range` header asking for specific bytes and the server returns only those.

### 300 status code

300 series status codes indicate that the client must take additional steps to complete the request. They are generally used in URL redirection.

Example: 301 Moved Permanently
304 Not Modified

The distinction between 301 and 302 matters more than it seems. A **301** is permanent, and browsers and search engines cache it aggressively, sometimes indefinitely. Issue a wrong 301 and visitors who already received it will keep following it even after you fix the configuration. A **302** is temporary and is not cached the same way. When in doubt during testing, use 302.

### 400 status code

400 series status codes indicate that the client seems to have sent a request that is not valid or is in some way in error.

Example: 401 Unauthorized
403 Forbidden
404 Page Not Found

In NGINX specifically, a **403** on a file that plainly exists is almost always a filesystem permission problem or an SELinux denial, not an NGINX configuration error. Check `ls -l` on the file and the whole directory path above it, since NGINX needs execute permission on every parent directory, then check `ausearch -m avc -ts recent`.

### 500 status code

500 series status codes indicate that the issue is on the server side and it has failed to fulfill the request.

Example: 500 Internal Server Error
504 Gateway Timeout
503 Service Unavailable

For NGINX acting as a proxy, these have specific meanings that point straight at the cause:

- **502 Bad Gateway** — NGINX reached the backend but got an invalid or empty response. Usually the backend process is down or the socket path is wrong.
- **504 Gateway Timeout** — the backend accepted the connection but did not respond within `proxy_read_timeout`. The backend is alive but too slow.
- **503 Service Unavailable** — often NGINX itself, when every server in an upstream group has been marked unhealthy.

Distinguishing 502 from 504 saves a lot of time: one means "it is not there", the other means "it is there but stuck".

# NGINX Architecture

**Where are nginx configuration files located?**

To find this out, do a `nginx -t`.

```
[root@ccc ~]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

`nginx -t` earns its place as the single most important command on this page. Run it before every reload, without exception. It parses the configuration and verifies that referenced files exist and are readable, so a typo costs you a warning instead of an outage.

Its capital-letter sibling is nearly as useful:

```bash
nginx -T
```

That dumps the entire effective configuration with every `include` resolved. On a server where configuration is scattered across a dozen files in `conf.d`, this is how you find out what is actually in force rather than what you think is.

**Masters and workers**

```
[root@client ~]# ps -ef --forest | grep nginx
root        1477    1255  0 12:52 pts/0    00:00:00              \_ grep --color=auto nginx
root        1446       1  0 12:48 ?        00:00:00 nginx: master process /usr/sbin/nginx
nginx       1448    1446  0 12:48 ?        00:00:00  \_ nginx: worker process
```

There will be nginx masters and workers.

**Master**

- Reads and evaluates configuration files.
- Manages worker processes.

**Worker**

- Does the actual processing of requests.

The master process runs as root, whereas worker processes run as the user defined in `nginx.conf`. By default, that is the `nginx` user. The port where the web server runs is bound by the master process.

That split is a deliberate security design and worth understanding. Only root can bind to ports below 1024, so the master does that once at startup and then hands the listening sockets to unprivileged workers. The processes actually parsing untrusted input from the internet never run as root. If a worker is compromised, the attacker gets the `nginx` user, not the machine.

It is also what makes graceful reloads possible. On `systemctl reload`, the master starts new workers with the new configuration and tells the old ones to finish their in-flight requests and then exit. No connection is dropped. This is why `reload` should always be preferred over `restart` on a live server.

```
netstat -tnlp
```

On newer systems `ss -tlnp` is the maintained replacement and is noticeably faster.

Pick the nginx.conf file from the `/etc/nginx/` directory.

```
user nginx;
worker_processes auto;
```

`worker_processes auto` sets the number of worker processes to match the number of CPU cores. If you want to change the amount of worker processes to two, change `auto` to 2.

I did the same, restarted nginx, and here are the results:

```
[root@client nginx]# ps -ef --forest | grep nginx
root        1506    1255  0 12:58 pts/0    00:00:00              \_ grep --color=auto nginx
root        1501       1  0 12:58 ?        00:00:00 nginx: master process /usr/sbin/nginx
nginx       1502    1501  0 12:58 ?        00:00:00  \_ nginx: worker process
nginx       1503    1501  0 12:58 ?        00:00:00  \_ nginx: worker process
```

Now, there are two worker processes.

On the single-core VM in this lab, `auto` resolved to one worker, which is why setting it to 2 produced a visible change. In production, leave it on `auto`. One worker per core is the right answer, because each worker is event driven and handles thousands of concurrent connections; adding more workers than cores just adds context switching.

**To restart nginx**

```
systemctl restart nginx
```

Use this when changing `worker_processes` or the `user` directive, since those cannot be applied to running workers. For everything else, reload.

The next two lines of the `nginx.conf` file specify where the NGINX error log lives and where the PID of the master process is stored.

```
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;
```

`error_log` is where you look first when something is wrong. Note that it takes an optional severity level (`warn`, `error`, `crit`, `debug`), and that `debug` requires a build with `--with-debug`, which `nginx -V` will confirm.

# Configuration context

Whatever is enclosed inside the curly braces is called options, whereas the container is called context. Each option is a directive controlling a specific aspect of NGINX.

The various contexts in NGINX are:

- main
- events
- http
- mail

The rule that makes NGINX configuration comprehensible is **inheritance**: directives set in an outer context are inherited by inner ones unless overridden. Something set in `http` applies to every `server` block; something set in a `server` block applies to every `location` inside it. When a directive appears not to be working, the usual reason is that a more specific context has overridden it.

## Main context

Any directives that exist entirely outside of context blocks (not inside curly braces) are said to inhabit the "main" context.

```
user nginx;
worker_processes 2;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# Load dynamic modules. See /usr/share/doc/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf;
```

Since these configurations don't lie inside any container other than the main `nginx.conf` file itself, they're said to inhabit the "main context".

## Event Context

```
events {
    worker_connections 1024;
}
```

This defines how NGINX handles connections. `worker_connections` sets the maximum number of simultaneous connections that can be opened by a worker process.

The theoretical maximum is `worker_processes × worker_connections`. With 4 workers at 1024 connections each, that is 4096 simultaneous connections. Two practical qualifiers: as a reverse proxy each client connection also consumes a connection to the backend, roughly halving the effective figure, and the operating system's file descriptor limit will cap you before NGINX does. Raising `worker_connections` without also raising `worker_rlimit_nofile` and the systemd `LimitNOFILE` accomplishes nothing.

## HTTP Context

As a web server administrator, this is going to be the most used context in day to day life.

```
http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;

    server {
        listen       80;
        listen       [::]:80;
        server_name  _;
        root         /usr/share/nginx/html;

        # Load configuration files for the default server block.
        include /etc/nginx/default.d/*.conf;

        error_page 404 /404.html;
        location = /404.html {
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
        }
    }
```

Three of those defaults are doing more than they look:

**`sendfile on`** lets the kernel copy a file straight from disk to the network socket without passing through NGINX's own memory. For static files this is a substantial performance win.

**`keepalive_timeout 65`** keeps a client connection open for 65 seconds after a request, so subsequent requests reuse it instead of paying for a new TCP handshake and TLS negotiation. Given a modern page pulls dozens of resources, this matters a great deal.

**`server_name _`** is the default catch-all. The underscore is not special syntax, it is simply an invalid hostname that can never match a real `Host` header, so this block only answers requests that matched nothing else. Worth knowing, because "why is the wrong site being served" is nearly always a request landing here.

Some recipes follow.

**Changing the format of access.log**

```
 log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

```

This is the currently specified format for `access.log`.

Currently, the access.log looks like this:

```
192.168.1.66 - - [01/May/2024:13:50:04 +0545] "GET / HTTP/1.1" 200 7620 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.66 - - [01/May/2024:13:50:04 +0545] "GET /icons/poweredby.png HTTP/1.1" 200 15443 "http://192.168.1.4/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.66 - - [01/May/2024:13:50:04 +0545] "GET /poweredby.png HTTP/1.1" 200 368 "http://192.168.1.4/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.66 - - [01/May/2024:13:50:04 +0545] "GET /favicon.ico HTTP/1.1" 404 3332 "http://192.168.1.4/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
```

Reading that line field by field:

`remote_addr` is the IP address of the computer I am accessing the website from.
`remote_user` is unknown, so `-`.
`request` is `GET / HTTP/1.1`.
`status` is 200, i.e. the response code.
`body_bytes_sent` is 7620.

The `-` characters are simply NGINX's placeholder for an empty value, which is why `remote_user` shows one on a site with no HTTP authentication.

The single most valuable addition to the default format is `$request_time`, which records how long NGINX took to serve each request. Without it you cannot answer "was the site slow at 2 PM" from the logs at all:

```nginx
log_format timed '$remote_addr - $remote_user [$time_local] "$request" '
                 '$status $body_bytes_sent "$http_referer" '
                 '"$http_user_agent" rt=$request_time urt=$upstream_response_time';
```

`$upstream_response_time` alongside it tells you whether the delay was NGINX's or the backend's, which is exactly the question you need answered during an incident.

# Include directive and Modular Configuration of NGINX

There is the line below in the nginx.conf file.

```
# Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;
```

This one line is what keeps NGINX configuration manageable. Rather than one enormous `nginx.conf`, each site gets its own file in `conf.d`, which can be added, removed or version controlled independently. Note the glob only matches `*.conf`, which is a handy way to disable a site: rename it to `site.conf.disabled` and reload.

Visit `/etc/nginx/conf.d/`.

Currently, in my Rocky Linux 9 install, there are no default configuration files provided. Use the below as a template for `default.conf`. I picked this from my earlier Rocky Linux 8 config.

```
server {
    listen       80;
    server_name  localhost;

    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

    # proxy the PHP scripts to Apache listening on 127.0.0.1:80
    #
    #location ~ \.php$ {
    #    proxy_pass   http://127.0.0.1;
    #}

    # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
    #
    #location ~ \.php$ {
    #    root           html;
    #    fastcgi_pass   127.0.0.1:9000;
    #    fastcgi_index  index.php;
    #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
    #    include        fastcgi_params;
    #}

    # deny access to .htaccess files, if Apache's document root
    # concurs with nginx's one
    #
    #location ~ /\.ht {
    #    deny  all;
    #}
}
```

## Server blocks

`listen 80` means that the server is listening at port 80. You can change this to make the server listen on a different port. Once you change it, you'll have to specify the IP:port combination when accessing your website in a browser.

Change the port number to 65535 (the maximum allowable port number).

```
http://192.168.1.4:65535/
```

The website will run there now.

`location` determines which files are served for a given request path.

For example:

```
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
```

This tells NGINX that when accessing the `/` location, it should serve the file `/usr/share/nginx/html/index.html`. The root can be changed, as discussed later.

The mechanic worth internalising here is that `root` and the request URI are **concatenated**. A request for `/images/logo.png` with `root /usr/share/nginx/html` resolves to `/usr/share/nginx/html/images/logo.png`. Its counterpart `alias` replaces the matched portion instead of appending to it, which is the distinction behind a great many "why is it looking for that path" problems.

Say you want to change what's presented when you access:

```
http://192.168.1.4:65535/
```

Change the contents of index.html, or serve a different index page such as `default.html`.

```
echo "This is testy hello"> /usr/share/nginx/html/index.html
```

Reload the webpage and you'll see:

```
This is testy hello
```

# Configuring multiple websites on nginx

This is how you'll host a single website in NGINX.

```
cat default.conf
server {
    listen       65535;
    server_name  localhost;

    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
	}
```

Say you want to host two websites using the same NGINX server. Then you will need separate server blocks. The two servers will be `webone.internal` and `webtwo.internal`.

**For `webone.internal`**

```
cat /etc/nginx/conf.d/webone.conf
server {
    listen       65535;
    server_name  webone.internal;

    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html/webone;
        index  index.html index.htm;
    }
	}
```

**For `webtwo.internal`**

```
cat  /etc/nginx/conf.d/webtwo.conf

server {
    listen       65534;
    server_name  webtwo.internal;

    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html/webtwo;
        index  index.html index.htm;
    }
	}
```

Now create the required files and directories.

```
echo "This is webone.internal"> /usr/share/nginx/html/webone/index.html
echo "This is webtwo.internal"> /usr/share/nginx/html/webtwo/index.html
```

Now, when you access:

```
http://192.168.1.4:65534/
```

you'll see webtwo.internal's home page. Whereas, when you access:

```
http://192.168.1.4:65535/
```

you'll see webone.internal's home page.

The difference here is created by port numbers and not by domain name, so it's somewhat less intuitive. Let's try again to differentiate using domain names instead.

This is the important version, because port-based separation is not how real hosting works. Nobody wants to visit `example.com:65535`. What you actually want is both sites on port 80, distinguished by hostname, which is what the `Host` header discussed earlier makes possible.

It can be achieved by slightly tweaking the above configurations.

```
[root@client conf.d]# curl 'http://webone.internal'
This is webone.internal
[root@client conf.d]# curl 'http://webtwo.internal'
This is webtwo.internal
```

```
[root@client conf.d]# cat webone.conf
server {
    listen      80;
    server_name  webone.internal;

    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html/webone;
        index  index.html index.htm;
    }
        }
```

```
[root@client conf.d]# cat webtwo.conf

server {
    listen      80;
    server_name  webtwo.internal;

    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html/webtwo;
        index  index.html index.htm;
    }
        }

```

Both now listen on port 80. NGINX reads the `Host` header from the incoming request, matches it against each `server_name`, and routes accordingly. This is name-based virtual hosting, and it is how a single IP address serves hundreds of different websites.

For this lab to work, the hostnames have to resolve. Since `webone.internal` and `webtwo.internal` are not real domains, add them to `/etc/hosts` on whichever machine you are testing from:

```
192.168.1.4  webone.internal webtwo.internal
```

If a request arrives with a `Host` header matching no `server_name`, NGINX falls back to the first server block defined for that port, or to whichever is marked `default_server`. That fallback is the reason an unexpected site sometimes appears, and it is also why a catch-all block returning 444 is a good habit:

```nginx
server {
    listen 80 default_server;
    server_name _;
    return 444;
}
```

`444` is an NGINX-specific code that closes the connection without any response at all, which is a tidy way to handle bots probing your IP directly.

Don't forget to `reload` or `restart` NGINX after making those changes. To check if the configuration is valid, run `nginx -t`.

**To change the access.log location**

```
    #access_log  /var/log/nginx/host.access.log  main;
```

Change this value to something else, for example:

```
  access_log  /var/log/nginx/webone.access.log  main;
```

Giving each site its own access log is worth doing from the start. Grepping one combined log to work out which site an error belongs to gets old quickly, and per-site logs make traffic analysis straightforward. Remember to add the new paths to your logrotate configuration, or the disk fills up eventually.

# Reverse Proxy

Reverse proxy hides the origin server IP. Here NGINX is the reverse proxy.

The direction is what the name encodes and what confuses people at first. A *forward* proxy sits in front of clients and hides them from the internet, which is what a corporate web proxy does. A *reverse* proxy sits in front of servers and hides them from clients. The client believes it is talking to NGINX; it never learns that three application servers sit behind it.

This is the single most common way NGINX is deployed in production. The application server, whether Node, Java, Python or PHP, is not exposed to the internet at all. NGINX takes the connection, terminates TLS, and forwards a plain HTTP request to the backend on a private network.

## What a Reverse Proxy can do?

- It hides the existence of the original backend servers.
- Can protect the back-end servers from web-based attacks, DoS and many more.
- Can provide great caching functionality.
- Can optimize the content by compressing it.
- Can act as an SSL termination proxy.
- Request routing and many more.

SSL termination deserves emphasis, since it is the reason many teams adopt a reverse proxy in the first place. Rather than installing certificates on every application server and configuring TLS in each application framework, you terminate HTTPS once at NGINX. Certificate renewal happens in one place. The application servers speak plain HTTP on the internal network and do not need to know TLS exists.

## Lab: Reverse Proxy

Launch 3 servers:

```
1st->nginx reverse proxy
2nd->application server backend
3rd->authentication server
```

Install NGINX on all 3 servers and install `net-tools` on all 3 servers.

To install net-tools:

```
yum -y install net-tools
```

### Application Server Backend

```
cd /usr/share/nginx/html
echo "This is application server backend" > index.html
```

### Authentication Server

```
cd /usr/share/nginx/html
mkdir admin && cd admin
echo "This is auth server file under admin" > index.html
```

Make sure SELinux and the firewall are both disabled on all servers (this is a test environment).

> **On SELinux specifically:** in a proxy setup, SELinux blocks NGINX from making outbound network connections by default, which produces a 502 with a permission denied error in the log and no obvious cause. Rather than disabling it, the targeted fix is one boolean:
>
> ```bash
> setsebool -P httpd_can_network_connect 1
> ```
>
> This is worth knowing because it is the single most common SELinux issue with NGINX, and it will come up on a real server where disabling SELinux is not an option.

### Reverse Proxy Configuration

```
cd /etc/nginx/conf.d
vi proxy.conf
server {
    listen       80;
    server_name  localhost;

    location / {
        proxy_pass http://192.168.1.2;
    }

    location /admin {
        proxy_pass http://192.168.1.4;
      }
}
nginx -t
systemctl restart nginx
```

192.168.1.2 is the backend server's IP, and 192.168.1.4 is the authentication server's IP.

What `proxy_pass` is saying is that for a request arriving at location `/`, send the request to the backend server, whereas if the request comes to path `/admin`, send it to the admin (authentication) server.

There is a subtlety in `proxy_pass` that catches everyone once. A trailing slash on the target URL changes the behaviour: `proxy_pass http://192.168.1.4;` passes the full original path through, so `/admin/page` arrives at the backend as `/admin/page`. With `proxy_pass http://192.168.1.4/;` the matched location prefix is stripped, and the backend receives `/page`. Neither is wrong, but knowing which you are getting saves an afternoon.

### Testing the reverse proxy

```
http://192.168.1.3
```

When you open this URL, you should get the contents of your backend server as a response. Whereas, when you request:

```
http://192.168.1.3/admin/
```

you should get the contents of your authentication admin server as a response.

You have to remove the earlier configurations of `webone.conf` and `webtwo.conf` if you want conflict-free operation, otherwise you'll get 404 page not found and various types of errors.

That conflict is instructive rather than annoying. All three configurations declare server blocks on port 80, and NGINX has to choose one. Whichever it picks first for an unmatched `Host` becomes the default, which is why requests land somewhere unexpected. This is the `default_server` behaviour described earlier, met in the wild.

## `X-Real-IP`

Whenever a request arrives at the web server through a reverse proxy, the client from the backend's perspective is always the reverse proxy rather than the real client. To pass the original client IP through, we can use `X-Real-IP`.

This is not a cosmetic concern. Without it, every entry in your backend logs shows the same IP, rate limiting by client address becomes meaningless, and any geo-based logic sees only the proxy. Application-level security features that depend on client IP silently stop working.

For example, check the logs of the backend server located at `/var/log/nginx/access.log`. You'll notice that all the requests originate from the same IP, which happens to be the IP of our reverse proxy.

```
192.168.1.3 - - [01/May/2024:15:07:02 +0545] "GET /favicon.ico HTTP/1.0" 404 3332 "http://192.168.1.3/admin" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.3 - - [01/May/2024:15:07:02 +0545] "GET /favicon.ico HTTP/1.0" 404 3332 "http://192.168.1.3/admin" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.3 - - [01/May/2024:15:09:50 +0545] "GET /amdin HTTP/1.0" 404 3332 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.3 - - [01/May/2024:15:09:50 +0545] "GET /nginx-logo.png HTTP/1.0" 200 368 "http://192.168.1.3/amdin" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.3 - - [01/May/2024:15:09:50 +0545] "GET /poweredby.png HTTP/1.0" 200 368 "http://192.168.1.3/amdin" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.3 - - [01/May/2024:15:12:56 +0545] "GET / HTTP/1.0" 304 0 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.3 - - [01/May/2024:15:12:58 +0545] "GET / HTTP/1.0" 304 0 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.3 - - [01/May/2024:16:04:25 +0545] "GET / HTTP/1.0" 304 0 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.3 - - [01/May/2024:16:04:31 +0545] "GET / HTTP/1.0" 200 35 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.3 - - [01/May/2024:16:04:32 +0545] "GET /favicon.ico HTTP/1.0" 404 3332 "http://192.168.1.3/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
```

Every line shows `192.168.1.3`, the proxy, even though the actual client was a laptop at `192.168.1.71`. The real client IP is known to the reverse proxy, so we need a mechanism to pass it through to the backend logs.

### Reverse proxy side

```
vi /etc/nginx/conf.d/proxy.conf
proxy_set_header X-Real-IP $remote_addr;
```

If you check the reverse proxy logs, `remote_addr` is the IP of the client accessing the web server. So you take that variable and set `X-Real-IP` to it. It's like assigning a variable in programming.

In practice you want three headers rather than one, and they are conventionally set together:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

`Host` preserves the original hostname, without which a backend hosting several sites cannot tell which one was requested. `X-Forwarded-For` appends to any existing value rather than replacing it, so a chain of proxies produces a full trail. `X-Forwarded-Proto` tells the backend whether the client used HTTPS, which the backend cannot otherwise know after TLS termination, and getting this wrong is why applications sometimes generate `http://` links on an HTTPS site.

One caution: these headers are trivially forged by a client sending them directly. Trust them only from proxies you control, which is what the `set_real_ip_from` directive is for.

### Backend server side

```
nano /etc/nginx/nginx.conf
"$http_x_real_ip" (put this where log format is mentioned)
```

Any request header becomes available to NGINX as a variable named `$http_` plus the header name in lowercase with hyphens turned into underscores. So `X-Real-IP` becomes `$http_x_real_ip`. That naming rule works for every header, which makes it worth remembering.

To verify, let's first empty the access.log and error.log of the backend server.

```
cd /var/log/nginx
echo > error.log
echo > access.log
```

Now when we tail the backend server's log, we'll see the IP address of the real client at the end.

```
[root@backend nginx]# tail -f access.log

192.168.1.3 - - [01/May/2024:16:20:20 +0545] "GET / HTTP/1.0" 200 35 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-" "192.168.1.71"
```

`192.168.1.71` at the end is the real client. That is the whole point of the exercise.

# Load Balancers

- Can do health checks
- Distribute load among servers
- Support SSL/TLS termination

A load balancer is a reverse proxy pointed at a *group* of backends instead of one. Everything from the previous section still applies; the only new concept is the `upstream` block and how NGINX chooses which server in it receives a given request.

## Load Balancers: Lab

```
lbalancer->192.168.1.3
first->192.168.1.2
second->192.168.1.4
```

### Load Balancer server

`/etc/nginx/conf.d/load-balancer.conf`

```
	upstream backend{
  server 192.168.1.2:80;
  server 192.168.1.4:80;
}

server {
  listen 80;
  server_name localhost;

  location / {
  proxy_pass http://backend;
  }
}
```

Note that `proxy_pass` now points at `http://backend`, which is not a hostname but the name of the `upstream` block above. That indirection is the whole mechanism.

### first server

```
cd /usr/share/nginx/html/
echo "This is first server" > index.html
```

### second server

```
cd /usr/share/nginx/html
echo "This is second server"> index.html
```

Open `http://192.168.1.3/` in a browser and it'll alternate between the first and second servers.

Giving each backend a distinguishable response is the trick that makes load balancing visible. Without it you cannot tell whether anything is being distributed at all. `curl` in a loop shows the pattern more clearly than a browser, which caches:

```bash
for i in {1..10}; do curl -s http://192.168.1.3/; done
```

NGINX does automatic health checks, meaning if one server is down it won't send future requests to that server. To verify this, run `systemctl stop nginx` on the "first" server and you'll see that requests stop appearing in its `/var/log/nginx/access.log`.

## Active and Passive Health Checks

Passive health checks work as follows:

- If, while establishing a connection with the upstream server, there is a timeout or error, then the server is deemed to be unhealthy.
- NGINX waits a default 10 seconds before again trying to connect and send a request to an unhealthy server.
- You can use the `fail_timeout` parameter on the server directive to change this amount of time.
- You can use the `max_fails` parameter on the server directive to increase the number of errors or timeouts that must occur for NGINX to consider the server unhealthy.

The word *passive* is the key. NGINX is not proactively testing your backends; it is observing real requests and noticing failures. A consequence worth understanding: a real user's request is what discovers the failure, so that user gets the error. Active health checks, where the proxy polls a health endpoint on a schedule and removes a server before any user hits it, are a feature of NGINX Plus, the commercial version. On open source NGINX, passive checking is what you have, and it is usually good enough.

# Lab: `max_fails` and `fail_timeout`

The `proxy.conf` at reverse proxy server 192.168.1.3 should look like this:

```
upstream backend{
  server 192.168.1.2:80 max_fails=2 fail_timeout=30s;
  server 192.168.1.4:80 max_fails=2 fail_timeout=30s ;
}

server {
  listen 80;
  server_name lbaln.test;

  location / {
  proxy_pass http://backend;
  }
}
```

What the configuration is saying is:

- NGINX should wait 30s before sending a request to a dead server again. By default `fail_timeout` is 10 seconds.
- `max_fails` says how many times a request to the server must fail for NGINX to consider that "the server is dead". By default, `max_fails` is 1.

`fail_timeout` is doing double duty here, which is a genuine subtlety in the documentation. It is both the window within which `max_fails` failures must occur, and the period the server is then considered unavailable. So `max_fails=2 fail_timeout=30s` means: two failures inside 30 seconds marks the server down, and it stays down for 30 seconds before NGINX tries again.

Tuning this is a real tradeoff. Set `max_fails` too low and a single transient blip removes a healthy server from rotation. Set it too high and users keep being routed to a server that is genuinely broken.

## Traffic Distribution Method: Server Weight

In cases where one server has fewer hardware resources than another, we want to distribute load according to the resources available. This is done by assigning weight values. The more weight, the more load assigned. For example, with 2 servers where one has weight 8 and another weight 2, 80% of requests go to the server with weight 8 and the remaining 20% to the one with weight 2. In the scenario above, we can give the server with 4GB RAM a higher weight so that more load is assigned to it.

Put the configuration below on the proxy server as `proxy.conf`.

```
upstream backend{
  server 192.168.1.2:80 ;
  server 192.168.1.4:80 weight=2 ;
}

server {
  listen 80;
  server_name weight.test;

  location / {
  proxy_pass http://backend;
  }
}
```

In this example, 66% of the requests will go to server 192.168.1.4 whereas the rest will go to 192.168.1.2.

The arithmetic: an unspecified weight defaults to 1, so the ratio is 1:2 across a total of 3, giving 33% and 67%. Weights are relative, not percentages, so `weight=2` and `weight=4` distribute identically to `weight=1` and `weight=2`.

## Least Connect Method

Imagine a scenario where one server is running a big script that takes a long time to complete, whereas the other server is running a small script that finishes in a few milliseconds.

If we use round-robin load balancing (the default) in this case, it'll overload the server running the long script, and response times will be painfully slow.

The least connections method helps here by making sure the request goes to the server with the fewest active connections. Consider the scenario below:

- Request A comes to the first server.
- Request B comes to the second server. B is served its response.
- Request A is still executing as it's a huge script.
- Now, with round robin, Request C also goes to the first server.
- Meanwhile Request A is still executing. This overloads the server and delays the response to the client.

How does least connections solve this problem?

- Turn on the `least_conn` flag.
- Request A comes to the first server. conn=1
- Request B comes to the second server. conn=1. B is served its response. conn=0
- Request A is still executing as it's a huge script. conn=1
- Request C will now go wherever there are fewest connections, which in this case is the second server.

Put the configuration below on your proxy server acting as load balancer. Try executing a large script in one server's root while just rendering index.html in the other's, and check the difference in how many connections go to each.

```
load-balancer.conf

upstream backend {
	least_conn;
	server 52.4.121.83;
	server 52.3.20.56;
}
server{
	server_name mywebsitename;
	listen 80;
	location / {
		proxy_pass http://backend/test.php;
	}
}
```

The rule of thumb for choosing a method: use round robin, the default, when all requests cost roughly the same, which is typical for static content and simple APIs. Use `least_conn` when request duration varies a lot, which is typical for reporting, search and file uploads.

There is a third method worth knowing, `ip_hash`, which routes a given client IP consistently to the same backend:

```nginx
upstream backend {
    ip_hash;
    server 192.168.1.2;
    server 192.168.1.4;
}
```

This exists to handle applications that store session state in server memory, where a user bounced to a different backend appears to be logged out. It works, but it is a workaround for an application design problem. The better fix is to move sessions into Redis or a database so any backend can serve any user, at which point you can drop `ip_hash` and get better distribution.

# Topics I have not covered here yet

These are the areas I am still working through, and they are the natural next steps if you have followed everything above:

- **Caching subsystem** — `proxy_cache` can serve responses from disk without touching the backend at all. On a content-heavy site this is the single largest performance improvement available.
- **Advanced logging** — conditional logging, excluding health checks from the access log, and shipping logs to a central collector.
- **Cryptography module** — TLS version and cipher selection, OCSP stapling, HSTS.
- **Static asset optimisation** — `gzip` and `brotli` compression, `expires` headers, and `open_file_cache`.
- **Access control** — `allow` and `deny`, rate limiting with `limit_req`, and basic authentication.

Of those, rate limiting is the one I would learn first. `limit_req_zone` is a few lines of configuration and it is the most effective defence available against brute force login attempts and scraping.

# Frequently asked questions

**Should I use `reload` or `restart` after changing configuration?**
Reload, almost always. It applies the new configuration without dropping a single connection. Restart is only needed when changing `worker_processes`, the `user` directive, or the set of listening sockets.

**Why is NGINX serving the wrong site?**
The requested `Host` header matched no `server_name`, so NGINX fell back to the default server block for that port. Add a catch-all `default_server` block that returns 444 and the problem becomes obvious rather than mysterious.

**502 Bad Gateway, where do I start?**
The backend is unreachable. Confirm the backend process is running, confirm the address and port in `proxy_pass`, then check `/var/log/nginx/error.log` for the specific reason. If the error mentions permission denied, it is SELinux: `setsebool -P httpd_can_network_connect 1`.

**NGINX or Apache?**
For a reverse proxy, load balancer or static content, NGINX. Apache's advantage is per-directory `.htaccess` configuration, which matters mainly in shared hosting. For anything you control yourself, NGINX's performance model and configuration syntax are the better choice.

**How do I add HTTPS?**
For a public domain, Certbot does it in one command: `certbot --nginx -d yourdomain.com`. It edits the server block and configures automatic renewal.

**How many `worker_connections` do I need?**
Leave `worker_processes auto` and `worker_connections 1024` alone until you have measured a reason to change them. If you do raise connections, raise `worker_rlimit_nofile` and the systemd `LimitNOFILE` alongside, or the operating system will cap you before NGINX does.

# Wrapping up

The thing that made NGINX click for me was realising the configuration file is not a list of features but a description of how a request travels: it arrives on a `listen` port, gets matched to a `server` block by its `Host` header, gets matched to a `location` by its path, and is then either served from disk or proxied onwards. Web server, reverse proxy and load balancer are all just different endings to that same journey.

If you build the three-server lab in this page yourself rather than reading it, you will end up understanding reverse proxies better than most people who have used them for years. The `X-Real-IP` exercise in particular is worth doing properly, because seeing every log line show the proxy's IP and then watching the real client appear is the moment the whole idea becomes concrete.

# References

https://www.udemy.com/course/nginx-beginner-to-advanced/

https://www.nginx.com/blog

https://docs.nginx.com/nginx/admin-guide/

HTTP The Definitive Guide, David Gourley
