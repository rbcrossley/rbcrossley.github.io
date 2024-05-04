---
title: Managing HTTP servers with NGINX
date: 2024-04-20
draft: false
ShowToc: true
---

# Infrastructure required

I am using Rocky Linux 9, you can use any linux distributions and the result will be same. But I will recommend choose any Red-hat based distributions. Make sure to have at least 3 servers ready. Example:

```
192.168.1.2
192.168.1.3
192.168.1.4
```

# Installing NGINX

## Using `yum` package manager

```
yum install nginx -y
```

## Using `rpm`

```
yum -y install wget
wget https://nginx.org/packages/rhel/9/x86_64/RPMS/nginx-1.20.2-1.el9.ngx.x86_64.rpm
yum install nginx*.rpm
```

**Start and Enable NGINX**

```
systemctl start nginx && systemctl enable nginx
```

**Check `nginx` version with other details**

```
nginx -V
```

**Only check the `nginx` version**

```
nginx -v
```

# HTTP Protocol

## HTTP GET

GET method is used to fetch the information which is specified in the request URI.
**Handwriting GET**
You can use `telnet` to send GET request to a non-https website. As per my current knowledge, the only flexible way to send GET request is to use `curl` command.
I can't seem to find a website that doesn't uses https so here's an example extracted from Zeal Vora's nginx course on udemy.

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

`curl` With `-I` option shows the response headers only.

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

### Conditional GET

Only show the website if some condition is met. Use the `--header` option to put the conditions.

```cmd
curl --header "If-Modified-Since:Wed, 18 Oct 2017 05:19:43 GMT" dexter.kplabs.in/sample.html
```

If the file wasn't modified since 2017 october 18th, we'll get `304 Not Modified` HTTP response. Note that it's not like we don't get anything.

## HTTP POST

It is used to send some data to be processed in some way. HTTP POST is very useful. When you type query in google search and click on search, POST request is sent to the google's server.

## HTTP TRACE

It will echo the content of the request bac to the requestor(except credentials like passwords, cookies etc). It is useful to identify any changes to the request by any intermediate proxies as proxies manipulate headers.
It doesn't contain body. It's used for debugging purposes.

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

NGINX doesn't allow OPTIONS header at all.

## HTTP Response Status Code

There are various Response Status Codes available

- 100-199- Informational Status Codes
- 200-299- Success Status Codes
- 300-399- Redirection Status Codes
- 400-499- Client Error Status Codes
- 500-599- Server Error Status Codes

### 200 status code

200 status code indicates that the action received by the client is:

- Received, Understood, Accepted & Processed

Example: 200 OK
206 Partial Content

### 300 status code

300 series status code indicates that the client must take additional steps to complete the requests.
300 series status code are generally used in URL redirection.

Example: 301 Moved Permanently
304 Not Modified

### 400 status code

400 series status code indicates that the client seem to have sent some request which is not an ideal one or error some.

Example: Unauthorized
403 Forbidden
404 Page Not Found

### 500 status code

500 series status code indicates that the issue is there on the server side and it has failed to fulfill the request.

Example: 500 Internal Server Error
504 Gateway Timeout
503 Service Unavailable

# NGINX Architecture

**Where are nginx configuration files located?**
To find this out, do a `nginx -t`.

```
[root@ccc ~]# nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Masters and workers**

```
[root@client ~]# ps -ef --forest | grep nginx
root        1477    1255  0 12:52 pts/0    00:00:00              \_ grep --color=auto nginx
root        1446       1  0 12:48 ?        00:00:00 nginx: master process /usr/sbin/nginx
nginx       1448    1446  0 12:48 ?        00:00:00  \_ nginx: worker process
```

There will be nginx masters and workers.
**Master**

- Read and evaluate configuration files.
- Manage worker process.
  **Worker**
- Does the actual processing of requests.
  Master process runs with user root, whereas worker process runs with user as defined in `nginx.conf` file. By default, it's the `nginx` user.
  The port where the web server runs is the port of master process.

```
netstat -tnlp
```

Pick the nginx.conf file from /etc/nginx/nginx.conf directory.

```
user nginx;
worker_processes auto;
```

worker_processes auto will set the amount of worker processes to 1. If you want to change the amount of worker processes to two, change auto to 2.
I did the same, restarted nginx and here are the results

```
[root@client nginx]# ps -ef --forest | grep nginx
root        1506    1255  0 12:58 pts/0    00:00:00              \_ grep --color=auto nginx
root        1501       1  0 12:58 ?        00:00:00 nginx: master process /usr/sbin/nginx
nginx       1502    1501  0 12:58 ?        00:00:00  \_ nginx: worker process
nginx       1503    1501  0 12:58 ?        00:00:00  \_ nginx: worker process
```

Now, there are two worker processes.
**To restart nginx**

```
systemctl restart nginx
```

The next 2 lines of `nginx.conf` file tells that the nginx error log is located in which location and the pid of the master process is located in `run/nginx.pid`.

```
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;
```

# Configuration context

Whatever is enclosed inside the curly braces, is called options. Whereas, the container is called context. Each options are like a set of directives to control specific aspect of Nginx.
Various contexts in nginx are:

- main
- events
- http
- mail

  ![image of nginx](/images/1.png)

## Main context

Any directives that exist entirely outside of context blocks(something not inside curly braces) is said to inhabit the "main" context.

```
user nginx;
worker_processes 2;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# Load dynamic modules. See /usr/share/doc/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf;
```

Since these configurations doesn't lie inside any container, but the main nginx.conf container, they're said to inhabit the "main context".

## Event Context

```
events {
    worker_connections 1024;
}
```

This defines how nginx handles connections. `worker_connections` sets the maximum number of simultaneous connections that can be opened by a worker process.

## HTTP Context

As a webserver administrator, this is going to be the most used context in day to day life.

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

I'll discuss some receipes below.
**Changing the format of access.log**

```
 log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

```

This is the current specified format for access.log.
Currently, the access.log looks like this.

```
192.168.1.66 - - [01/May/2024:13:50:04 +0545] "GET / HTTP/1.1" 200 7620 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.66 - - [01/May/2024:13:50:04 +0545] "GET /icons/poweredby.png HTTP/1.1" 200 15443 "http://192.168.1.4/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.66 - - [01/May/2024:13:50:04 +0545] "GET /poweredby.png HTTP/1.1" 200 368 "http://192.168.1.4/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
192.168.1.66 - - [01/May/2024:13:50:04 +0545] "GET /favicon.ico HTTP/1.1" 404 3332 "http://192.168.1.4/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-"
```

`remote_addr` is the IP address of the computer I am accessing the website from.
`remote_user` is unknown so `-`.
`request` is `GET / HTTP/1.1`.
`status` is 200 i.e the response code.
`body_bytes_sent` is 7620.
And so on.

# Include directive and Modular Configuration of NGINX

There is the below line in nginx.conf file.

```
# Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;
```

Visit `/etc/nginx/conf.d/`
Currently, in my rocky linux 9, there are no default configuration files provided.
Use this below as template for `default.conf`. I picked this from my earlier rocky linux 8 config.

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

`listen 80` means that the server is listening at port 80. Obviously, you can change this to make the server listen at a different port. Once you change this, you'll have to specify the IP:port combination when trying to access your website in web browser.
Change the port number to 65535(maximum allowable port number logically).

```
http://192.168.1.4:65535/
```

The website will run here now.
`location` means from which location the file should load while browsing that provided location.
For example

```
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
```

This tells while accessing the `/` location of a nginx web server, nginx should serve the file `/usr/share/nginx/html/index.html`. The root can definitely be changed. It'll be discussed later.
Say you want to change what's being presented when you access

```
http://192.168.1.4:65535/
```

Change the contents of index.html. Or serve a different index page like say `default.html`.

```
echo "This is testy hello"> /usr/share/nginx/html/index.html
```

Reload the webpage, you'll see

```
This is testy hello
```

# Configuring multiple websites on nginx

This is how you'll host a single website in nginx.

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

Say you want to host two websites using the same nginx server. Then, you will need separate server blocks. Two servers will be `webone.internal` and `webtwo.internal`.
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

Now, when you access

```
http://192.168.1.4:65534/
```

you'll see webtwo.internal's home page.
Whereas, when you access

```
http://192.168.1.4:65535/
```

you'll see webone.internal's home page. The difference here is created by port numbers and not by domain name, so it's somewhat less intuitive. Let's try again to differentiate using domain names instead.
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

Don't forget to `reload` or `restart` nginx after making those changes.
To check if the configuration is successful or not `nginx -t`.

**To change the access.log location**

```
    #access_log  /var/log/nginx/host.access.log  main;
```

Change this value to something else, example

```
  access_log  /var/log/nginx/webone.access.log  main;
```

# Reverse Proxy
![reverse proxy](/images/reverse_proxy.png)


Reverse proxy hides the origin server IP. Here NGINX is the reverse proxy.

## What a Reverse Proxy can do?

- It hides the existence of the original backend servers.
- Can protect the back-end servers from web-based attacks, DOS and many more.
- Can provide great caching functionality.
- Can optimize the content by compressing it.
- Can act as a SSL termination proxy.
- Request routing and many more.

## Lab: Reverse Proxy

Launch 3 servers

```
1st->nginx reverse proxy
2nd->application server backend
3rd->authentication server
```

Install nginx in all 3 servers and install `net-tools` in all 3 servers.
To install net-tools

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

Make sure selinux and firewall both are disabled in all servers(this is test environment).

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

192.168.1.2 is backend server's IP. And 192.168.1.4 is authentication server' IP.
What proxy_pass is telling here is that for a request that comes at location `/`, send the request to backend server. Whereas, if the request comes to path `/admin`, send the request to the admin server(authentication server).

### Testing the reverse proxy

```
http://192.168.1.3
```

When you open this URL, you should get the contents of your backend server as response. Whereas, when you

```
http://192.168.1.3/admin/
```

request this URL, you should get the contents of your authentication admin server as a response.
You've to remove the earlier configurations of `webone.conf` and `webtwo.conf` if you want conflict free operation, otherwise you'll get 404 page not found and various types of errors.
## `X-Real-IP`

Whenever a requests arrives to webserver in reverse proxy, the client is always the "reverse proxy server" instead of the real client. To bind the client IP with webserver IP, we can use X-Real-IP.
For example, check the logs of backend server located at `/var/log/nginx/access.log`. You'll notice that all the requests are originating from the same IP which happens to be the IP of our reverse proxy.

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

The IP of real client is known to the reverse proxy, so we need some mechanism to pass this IP to the backend server logs.

### Reverse proxy side

```
vi /etc/nginx/conf.d/proxy.conf
proxy_set_header X-Real-IP $remote_addr;
```

If you check the reverse proxy logs, the `remote_addr` is the IP of the client accessing the web server. So, you take that variable and set `X-Real-IP` to that variable. It's like initializing a variable in programming(sort of, I am no programming expert!).

### Backend server side

```
nano /etc/nginx/nginx.conf
"$http_x_real_ip" (put this where log format is mentioned)
```

It should like something like this:
![](../../static/images/Pasted%20image%2020240501161327.png)
To verify, let's first empty the access.log and error.log of backend server.

```
cd /var/log/nginx
echo > error.log
echo > access.log
```

Now when we tail the backend server's log, we'll see the IP address of real client at the last.

```
[root@backend nginx]# tail -f access.log

192.168.1.3 - - [01/May/2024:16:20:20 +0545] "GET / HTTP/1.0" 200 35 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" "-" "192.168.1.71"
```

# Load Balancers

- can do health check
- distribute load among servers
- support SSL/TLS termination

## Load Balancers:Lab

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

Open `http://192.168.1.3/` this URL in chrome browser, it'll periodically rotate over first and second server.
nginx does auto health checks. Meaning if one server is down, it won't send future requests to that server.
To verify this, do `systemctl stop nginx` in "first" server and you'll figure out that the requests will stop coming to its `/var/log/nginx/access.log`.

## Active and Passive Health Checks

Passive health checks work as follows:

- If while establishing a connection with the upstream server, there is some timeout or error, then the serve is deemed to be unhealthy.
- NGINX waits a default 10 seconds before again trying to connect and send a request to an unhealthy server.
- You can use the `fail_timeout` parameter to the server directive to change this amount of time.
- You can use the `max_fails` parameter to the server directive to increase the number of errors or timeouts that must occur for NGINX to consider the server unhealthy.

# Lab: `max_fails` and `fail_timeout`

The `proxy.conf` at reverse proxy server 192.168.1.3 should look like this.

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

What the configuration is telling is that

- NGINX should wait for 30s before sending request to a dead server. By default `fail_timeout` is 10 secs.
- `max_fails` is telling how many times the request to server should fail in order for NGINX to confirm that "server is dead". By default, `max_fails` is 1.

## Traffic Distribution Method: Server Weight

![alt](/images/weight2.png)

In cases where one server is having less hardware resources compared to the second server, we want to distribute the load based on the resources available in the servers. It is done by assigning weight values. More the weight, more the load assigned to it. Example: If there are 2 servers and one is getting weight 8 and another is given weight 2. It means 80% of request will get to the server with weight 8 and remaining 20% will go to the server with weight 2. In the above example scenario, we can make the server with 4GB RAM to have a higher weight value, so that more load is assigned to it.
Put the below configuration on proxy server's configuration as `proxy.conf`.

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

In this example, 66% of the requests will go to server 192.168.1.4 whereas rest of requests will go to 192.168.1.2.

## Least Connect Method

![alt](/images/least_connect.png)

Imagine a scenario where one server is running a big script that takes lots of time to complete. Whereas, the other server is running a small script that takes few miliseconds to complete.
If we select round-robin load balancing(which is by default) in this case, it'll cause overload on server that is running a big script that takes lots of time. And the response time will be painfully slow.
Least connect method helps in this case by making sure that the request goes to a server that has least amount of connections. Imagine the below scenario:

- Request A comes to first server.
- Request B comes to second server. B is served response.
- Request A is still executing as it's a huge script.
- Now, if we're using round robin, Request C will come to first server.
- Meanwhile, Request A is still being executed. It'll overload the server and there will be huge amount of delay in response to the client.
  How least connections solve this problem?
- Turn on the `least_conn` flag.
- Request A comes to first server. conn=1
- Request B comes to second server. conn=1. B is served its response. conn=0
- Request A is still executing as it's a huge script. conn=1
- Request C will now go wherever there is least amount of connections, which in this case is second server.
  Put the below configuration in your proxy server acting as load balancer. Try to execute a large script in one of the server's root whereas just render index.html in another server's root. And check the difference in the amount of connections that go to server A and server B.

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

# TODO

- Caching subsystem of NGINX
- Logging in NGINX
- NGINX cryptography module
- Static assets in NGINX
- Access Control in NGINX

# References

https://www.udemy.com/course/nginx-beginner-to-advanced/

https://www.nginx.com/blog

https://docs.nginx.com/nginx/admin-guide/

HTTP The definitive guide, David Gourley
