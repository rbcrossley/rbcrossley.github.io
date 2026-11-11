---
title: LEMP stack deployment in Linux
description: Follow my step-by-step LEMP and WordPress deployment on a Rocky Linux 10.2 server using NGINX, MySQL, and PHP, with firewall, SELinux, services, and testing.
date: 2026-09-08
author: BerojgarEngineer
image: /images/blog/wordpress-using-nginx.jpg
tags: ["LEMP stack", "NGINX", "MySQL", "PHP", "WordPress", "Red Hat Linux", "CentOS", "Linux server administration", "web server setup", "SELinux", "firewalld", "self-hosted WordPress"]
categories: ["linux", "devops"]
---

LEMP stack stands for:

- Linux(I am on Rocky Linux 10.2)
- Nginx(Engine X)
- MySQL
- PHP

The E in LEMP comes from the way NGINX is pronounced, "Engine X". It is the same idea as the older LAMP stack, with Apache swapped out for NGINX.

LEMP stack can be used to create a wordpress site.

**Install relevant tools:**

These are the download and archive utilities the later steps depend on. A minimal server install usually ships without them.

```
dnf install -y wget curl tar unzip
```

For some reasons, this was taking too much time. I have waited for more than 10 minutes for this to run completely. 


**Configure firewall & selinux**

To allow ports. Else just disable for lab purposes.

```
systemctl disable --now firewalld
```
I will make a separate post on firewall hardening later on.


Disable selinux as well.

```
vi /etc/selinux/config
```
And set `SELINUX=enforcing` to `disabled`.

And reboot.

Issue faced: I lost my IP address of the Virtual Machine after I rebooted.

I rebooted it again to verify if earlier reboot was not done successfully.


But turns out it is a different case.

I will have to investigate a bit on this, and surely will write up what I found out.

All I had to do was to wait for some time and I got the ip in my vm. I had not set static IP in the vm, so maybe that is why due to other devices in the same LAN occupying that IP address, it hesitated to get that IP again. I will write up on how to set static IP later on.

PS I was getting too slow connection through Wifi in virtualbox, here is how I fixed it:

- gave 2 cores of vCPU to the VM.
- I am on acer aspire go 14, so under network->bridged adapter, I picked Realtex 8852be Wireless LAN WIFI 6 PCI-E NIC
- And adapter type as paravirtualized network (virtio-net)
- As well as system->acceleration->paravritualization interface=KVM

![Para virtualization interface setting in virtualbox](images/blog/virtualbox.png)

Now the speed over wifi is over MB/s, which was earlier only 10s of KBs per second.
**Install LEMP stack(along with PHP's extensions) & enable services**

```
dnf install -y epel-release && dnf install -y nginx mysql mysql-server php php-mysqlnd php-pgsql php-curl php-json php-gd php-xml php-mbstring php-zip && 
systemctl enable --now nginx.service && systemctl enable --now mysqld && sudo systemctl enable --now php-fpm
```
My preferred way of executing these commands is saving them in a file (install-and-enable-services.sh), and executing them with:

```
bash install-and-enable-services.sh
```

Here I was facing another problem where I was not finding mysql and mysql-server packages in dnf repo.

```
No match for argument: mysql-server
Error: Unable to find a match: mysql-server
```



**mysql_secure_installation**

```
mysql_secure_installation
```

Just press enter for everything besides password where you enter mysql root user password.

This script exists because a fresh MySQL install ships with anonymous users, a test database, and remote root login enabled. It walks you through removing all of them.

> **On a real server, do not just press enter.** Answer yes to removing anonymous users, disallowing remote root login, and dropping the test database. Those defaults are exactly what automated scanners look for. Pressing enter through the prompts is a lab shortcut, nothing more.

Login to mysql &:

```
USE mysql;
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'admin';
FLUSH privileges;
```

The `'admin'@'localhost'` part is worth reading carefully. In MySQL, a user is identified by both a username **and** the host they connect from. `'admin'@'localhost'` and `'admin'@'%'` are two entirely different accounts. Restricting to `localhost` means this account cannot be used from another machine, which is what you want when the application and database live on the same server.

`FLUSH PRIVILEGES` reloads the grant tables from disk. It is only strictly needed if you modified the `mysql` system tables directly rather than using `CREATE USER` and `GRANT`, but running it does no harm.

> **`admin`/`admin` is a lab credential.** On anything reachable from a network, use a generated password and grant privileges only on the specific database that application needs, never globally.

**phpmyadmin installation & configuration**

phpMyAdmin is a browser based MySQL client. It is genuinely useful while you are learning, because you can see the database WordPress builds instead of imagining it.

```
cd /tmp
wget https://files.phpmyadmin.net/phpMyAdmin/5.2.1/phpMyAdmin-5.2.1-all-languages.tar.gz
tar -xzvf php*
mv php* phpmyadmin (rename)
mv phpmyadmin /var/www/html/
sudo ln -s /var/www/html/phpMyAdmin /usr/share/nginx/htmlhtml/
chown -R nginx:nginx /var/www/html/phpmyadmin/ && sudo chmod 755  /var/www/html/phpmyadmin/
```

Two things to watch here. Linux filenames are case sensitive, so if you renamed the directory to lowercase `phpmyadmin`, the symlink must reference `phpmyadmin` and not `phpMyAdmin`. And check the destination path of that symlink against your actual NGINX document root, which is `/usr/share/nginx/html` on a default install.

The `chown -R nginx:nginx` matters because PHP-FPM runs as the `nginx` user on Red Hat systems. If the files are owned by root, PHP cannot read them and you get a 403.

Configuration part:

```
sudo vi /var/www/html/phpmyadmin/config.inc.php
# Since we want to login phpmyadmin without password, put these in configuration file;
## Fill the blowfish secret as "openssl rand -base64 32"
 $cfg['Servers'][$i]['AllowNoPassword'] = true;
Make sure the above is true.
 $cfg['Servers'][$i]['auth_type'] = 'config';
 $cfg['Servers'][$i]['user'] = 'root';
 $cfg['Servers'][$i]['password'] = 'root';
 $cfg['Servers'][$i]['extension'] = 'mysqli';
 $cfg['Lang'] = '';
```

> **This configuration is for an isolated lab VM only.** What it does is store the MySQL root password in a plain text file and hand anyone who reaches the URL a fully authenticated root session with no login prompt. On an internet facing server this is a complete database compromise waiting to happen.
>
> For anything beyond a disposable lab, set `auth_type` to `cookie` so phpMyAdmin prompts for credentials, leave `AllowNoPassword` as `false`, and restrict access by IP in your NGINX server block:
>
> ```nginx
> location /phpmyadmin {
>     allow 192.168.1.0/24;
>     deny all;
> }
> ```
>
> Better still, do not expose phpMyAdmin publicly at all. Reach it over an SSH tunnel when you need it.

The blowfish secret is what phpMyAdmin uses to encrypt the cookie holding your credentials. Generate a real one rather than leaving it blank:

```bash
openssl rand -base64 32
```

**Download wordpress**

```
wget https://wordpress.org/latest.zip
unzip latest.zip
mv wordpress/ /var/www/html/
```

Set the ownership so WordPress can write to its own directories. Without this, uploading media and installing plugins from the dashboard will fail:

```bash
chown -R nginx:nginx /var/www/html/wordpress
```

**Configure nginx**

This is the file that ties everything together. Read the comments in the walkthrough below it before you paste this in.

```
server {
        listen 80;
          server_name 192.168.1.101;

        location /phpmyadmin{
         root /var/www/html;
          index index.php index.html index.htm index.nginx-debian.html;

          access_log /var/log/nginx/phpmyadmin_access.log;
          error_log /var/log/nginx/phpmyadmin_error.log;

}
        location /wordpress{
         root /var/www/html/;
          index index.php index.html index.htm index.nginx-debian.html;

          access_log /var/log/nginx/wp_access.log;
          error_log /var/log/nginx/wp_error.log;

}

          location / {
            try_files $uri $uri/ /index.php;
          }

          location ~ ^/(doc|sql|setup)/ {
            deny all;
          }

          location ~ \.php$ {
            fastcgi_pass unix:/run/php-fpm/www.sock;

            fastcgi_param SCRIPT_FILENAME /var/www/html/$fastcgi_script_name;
            include fastcgi_params;

          }


          location ~ /\.ht {
            deny  all;
          }
}
```

Save this as `/etc/nginx/conf.d/lemp.conf` and replace `192.168.1.101` with your server's IP or domain name.

Walking through the blocks that matter:

**`location ~ \.php$`** is the handoff to PHP-FPM described earlier. Any request ending in `.php` is passed over the Unix socket at `/run/php-fpm/www.sock` instead of being served as a file. If you see your PHP source code rendered as plain text in the browser, this block is missing or not matching. If you get a 502 Bad Gateway, PHP-FPM is not running or the socket path is wrong. Check the real path with `grep listen /etc/php-fpm.d/www.conf`.

**`try_files $uri $uri/ /index.php`** is what makes WordPress permalinks work. NGINX looks for a matching file, then a matching directory, and finally falls back to `index.php`, which is where WordPress reads the URL and decides what to render. Without this line every post URL returns a 404 while the homepage works fine.

**`location ~ ^/(doc|sql|setup)/`** and **`location ~ /\.ht`** block access to phpMyAdmin's setup scripts and to Apache `.htaccess` files. Both are directories that automated scanners probe constantly.

**Reload nginx**

Test the syntax first. This catches unclosed braces and bad paths before they take the server down:

```bash
nginx -t
```

```
systemctl reload nginx
```

**browse phpmyadmin web panel**

Open `http://your-server-ip/phpmyadmin` in a browser.

Create database wordpress
Add user blog with password b10g

Do this through the phpMyAdmin interface, or run the SQL directly, which is faster and shows you what phpMyAdmin is doing under the hood:

```sql
CREATE DATABASE wordpress DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'blog'@'localhost' IDENTIFIED BY 'b10g';
GRANT ALL PRIVILEGES ON wordpress.* TO 'blog'@'localhost';
FLUSH PRIVILEGES;
```

The `utf8mb4` character set is worth specifying explicitly. It is the one that stores the full Unicode range correctly, which matters for Devanagari content and for emoji. The older `utf8` in MySQL is a three byte subset that will mangle both.

Note that the grant is scoped to `wordpress.*`, not `*.*`. WordPress has no reason to touch any other database, and limiting it means a compromised WordPress install cannot read the rest of your data.

**Install wordpress**

Now open `http://your-server-ip/wordpress` in the browser. WordPress detects that it has no configuration yet and starts its setup wizard.

The wizard asks for four things:

1. **Database name**: `wordpress`
2. **Username**: `blog`
3. **Password**: `b10g`
4. **Database host**: `localhost`

WordPress writes these into `wp-config.php` and then asks for your site title and an administrator account. Choose a real password for the admin account even in a lab; installs get found by scanners faster than you would expect.

If the wizard cannot write `wp-config.php` itself, it will show you the file contents to paste in manually. That is an ownership problem, fixed with the `chown` from the download step.

Once the install completes, your site is at `http://your-server-ip/wordpress` and the dashboard at `/wordpress/wp-admin`.

# When it does not work

The four failures I see most often, and what each one actually means:

**502 Bad Gateway**: NGINX reached the PHP-FPM socket and got nothing back. Either PHP-FPM is stopped (`systemctl status php-fpm`) or the socket path in `fastcgi_pass` does not match the one PHP-FPM is listening on.

**PHP code shown as plain text**: the `location ~ \.php$` block is not matching. Check for a typo, and confirm the file is inside the server block you think it is.

**403 Forbidden**: a permissions or SELinux issue. Check ownership is `nginx:nginx`, then check `ausearch -m avc -ts recent` for SELinux denials.

**White screen, nothing in the NGINX log**: this is the signature of a firewall or SELinux block. If the request never reaches NGINX, NGINX cannot log it. Test from the server itself with `curl localhost` to confirm the stack works, then work outward.

**"Error establishing a database connection"**: the credentials in `wp-config.php` do not match what MySQL has, or MySQL is not running. Verify by connecting manually: `mysql -u blog -p wordpress`.

# Frequently asked questions

**LEMP or LAMP, which should I learn?**
Learn LEMP. NGINX now serves the majority of the busiest sites on the internet and is what you will meet in most modern deployments, container images included. Understanding the PHP-FPM handoff is also more transferable than understanding Apache's embedded module.

**Do I need phpMyAdmin at all?**
No. The MySQL command line does everything phpMyAdmin does. It is a learning aid, useful when you want to see the tables WordPress creates. Many production servers deliberately do not install it, because it is a well known target.

**Can I run this on a 1 GB VPS?**
Yes, for a low traffic site. Tune `pm.max_children` in `/etc/php-fpm.d/www.conf` downward so PHP-FPM does not exhaust memory under load, and add a swap file.

**How do I add HTTPS?**
Install Certbot and run `certbot --nginx -d yourdomain.com`. It edits the server block for you and sets up automatic renewal.

**Why is my WordPress site slow?**
On a small server the usual causes are no page caching and no PHP opcode cache. Install a caching plugin and confirm `php-opcache` is enabled. Both make a larger difference than anything you can tune in NGINX.

# Wrapping up

You now have a working web server, database, PHP runtime and a live WordPress install, all wired together by configuration you wrote yourself. The specific commands matter less than the mental model: NGINX serves files and hands PHP off to a separate process manager, MySQL holds the data, and SELinux and the firewall sit in front of all of it deciding what gets through.

If you want a genuinely useful exercise, tear the VM down and rebuild it from scratch without looking at this page. The second attempt is when it actually sticks. From there, the natural next steps are adding HTTPS with Let's Encrypt, putting a caching layer in front, and eventually running the same stack in containers.
