---
title: LEMP stack deployment in Linux
description: Follow my step-by-step LEMP and WordPress deployment on a Red Hat Linux server using NGINX, MySQL, and PHP, with firewall, SELinux, services, and testing.
date: 2026-09-08
author: BerojgarEngineer
image: /images/blog/wordpress-using-nginx.jpg
---

Almost every Nepali IT graduate I know has installed WordPress at some point, usually through a hosting control panel where a single click does everything. That works, but it teaches you nothing about what is actually running underneath.

Building the stack yourself is different. You find out why PHP needs a separate process manager, why NGINX serves a blank page instead of your site, and what SELinux is really doing when it silently refuses to let the web server read a file. Those are the problems you will face on a real server, and they are the ones interviewers ask about.

This walkthrough deploys a complete LEMP stack on a Red Hat based Linux server and installs WordPress on top of it. I run this in my homelab on a virtual machine, and you can follow along on any VM with 2 GB of RAM and a fresh Rocky Linux, AlmaLinux, RHEL or CentOS install.

**A note before you start:** this is a lab build. Some steps below deliberately choose convenience over security so you can see the moving parts clearly, and I have flagged every one of them. Do not copy this configuration onto a public server without reading those warnings.

LEMP stack stands for:

- Linux
- Nginx(Engine X)
- MySQL
- PHP

The E in LEMP comes from the way NGINX is pronounced, "Engine X". It is the same idea as the older LAMP stack, with Apache swapped out for NGINX.

That swap is the interesting part. Apache creates a process or thread for every connection, which is simple but memory hungry under load. NGINX uses an event driven model where a small fixed number of worker processes handle thousands of connections each. On a small VPS, which is what most of us are actually deploying to, that difference decides whether your site survives a traffic spike.

The one thing NGINX does not do is execute PHP. Apache embeds a PHP module directly; NGINX hands PHP requests off to a separate service called PHP-FPM (FastCGI Process Manager) over a socket. Understanding that handoff explains most of the errors you will hit later, so keep it in mind when you get to the NGINX configuration.

LEMP stack can be used to create a wordpress site.

**Install relevant tools:**

These are the download and archive utilities the later steps depend on. A minimal server install usually ships without them.

```
dnf install -y wget curl tar unzip
```

**Configure firewall & selinux**

To allow ports. Else just disable for lab purposes.

This step trips up more people than anything else in the build, because when it goes wrong nothing appears in your NGINX logs. The service is running, the config is valid, and the page still will not load.

For a lab, opening the ports properly takes one command and is a better habit than disabling the firewall:

```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

SELinux is the second gate. Even with the firewall open, SELinux will block NGINX from reading files in non-standard locations or from opening network connections. For this lab you can allow what we need:

```bash
setsebool -P httpd_can_network_connect 1
semanage fcontext -a -t httpd_sys_rw_content_t "/var/www/html(/.*)?"
restorecon -Rv /var/www/html
```

> **If you disable SELinux instead:** understand that you are turning off a mandatory access control system that limits the damage a compromised web application can do. That is an acceptable tradeoff on a throwaway lab VM. It is not one on a server anyone else can reach. When something fails and you suspect SELinux, check `ausearch -m avc -ts recent` before reaching for `setenforce 0`.

**Install LEMP stack(along with PHP's extensions) & enable services**

```
dnf install -y epel-release
dnf install -y nginx mysql mysql-server php php-mysqlnd php-pgsql php-curl php-json php-gd php-xml php-mbstring php-zip
systemctl enable --now nginx.service && systemctl enable --now mysqld && sudo systemctl enable --now php-fpm
```

Those PHP extensions are not arbitrary. WordPress will refuse to install or will break in confusing ways without them:

- `php-mysqlnd` is the MySQL driver. Without it WordPress cannot reach the database at all.
- `php-gd` handles image resizing, which is how WordPress generates thumbnails.
- `php-xml` and `php-mbstring` are needed by the WordPress core and by most plugins for feed parsing and multibyte text handling. Anything in Nepali or Devanagari script depends on `mbstring`.
- `php-zip` is what lets WordPress install plugins and themes from the admin panel.
- `php-curl` handles outbound HTTP requests, including update checks.

`systemctl enable --now` does two things at once: it starts the service immediately and marks it to start on boot. Forgetting the `enable` half is a classic homelab mistake, discovered the next time the VM reboots.

Confirm all three are actually up before moving on:

```bash
systemctl status nginx mysqld php-fpm --no-pager
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

1. **Database name** — `wordpress`
2. **Username** — `blog`
3. **Password** — `b10g`
4. **Database host** — `localhost`

WordPress writes these into `wp-config.php` and then asks for your site title and an administrator account. Choose a real password for the admin account even in a lab; installs get found by scanners faster than you would expect.

If the wizard cannot write `wp-config.php` itself, it will show you the file contents to paste in manually. That is an ownership problem, fixed with the `chown` from the download step.

Once the install completes, your site is at `http://your-server-ip/wordpress` and the dashboard at `/wordpress/wp-admin`.

# When it does not work

The four failures I see most often, and what each one actually means:

**502 Bad Gateway** — NGINX reached the PHP-FPM socket and got nothing back. Either PHP-FPM is stopped (`systemctl status php-fpm`) or the socket path in `fastcgi_pass` does not match the one PHP-FPM is listening on.

**PHP code shown as plain text** — the `location ~ \.php$` block is not matching. Check for a typo, and confirm the file is inside the server block you think it is.

**403 Forbidden** — a permissions or SELinux issue. Check ownership is `nginx:nginx`, then check `ausearch -m avc -ts recent` for SELinux denials.

**White screen, nothing in the NGINX log** — this is the signature of a firewall or SELinux block. If the request never reaches NGINX, NGINX cannot log it. Test from the server itself with `curl localhost` to confirm the stack works, then work outward.

**"Error establishing a database connection"** — the credentials in `wp-config.php` do not match what MySQL has, or MySQL is not running. Verify by connecting manually: `mysql -u blog -p wordpress`.

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
