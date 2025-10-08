---
title: "Install wordpress on Rocky Linux 9 using NGINX as a webserver"
slug: "wordpress-LEMP-stack"
added: "2025-02-04"
description: "self hosted wordpress,how to self host a website"
layout: ../layouts/BlogPost.astro
---

If you're a video person:

https://www.youtube.com/watch?v=9N3WzfHSUWc

LEMP stack stands for:

- Linux
- Nginx(Engine X)
- MySQL
- PHP

LEMP stack can be used to create a wordpress site.

**Install relevant tools:**

```
dnf install -y wget curl tar unzip
```

**Configure firewall & selinux**

To allow ports. Else just disable for lab purposes.

**Install LEMP stack(along with PHP's extensions) & enable services**

```
dnf install -y epel-release
dnf install -y nginx mysql mysql-server php php-mysqlnd php-pgsql php-curl php-json php-gd php-xml php-mbstring php-zip
systemctl enable --now nginx.service && systemctl enable --now mysqld && sudo systemctl enable --now php-fpm
```

**mysql_secure_installation**

```
mysql_secure_installation
```

Just press enter for everything besides password where you enter mysql root user password.

Login to mysql &:

```
USE mysql;
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'admin';
FLUSH privileges;
```

**phpmyadmin installation & configuration**

```
cd /tmp
wget https://files.phpmyadmin.net/phpMyAdmin/5.2.1/phpMyAdmin-5.2.1-all-languages.tar.gz
tar -xzvf php*
mv php* phpmyadmin (rename)
mv phpmyadmin /var/www/html/
sudo ln -s /var/www/html/phpMyAdmin /usr/share/nginx/htmlhtml/
chown -R nginx:nginx /var/www/html/phpmyadmin/ && sudo chmod 755  /var/www/html/phpmyadmin/
```

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

**Download wordpress**

```
wget https://wordpress.org/latest.zip
unzip latest.zip
mv wordpress/ /var/www/html/
```

**Configure nginx**

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
            deny all;
          }
}
```

**Reload nginx**

```
systemctl reload nginx
```

**browse phpmyadmin web panel**

Create database wordpress
Add user blog with password b10g

**Install wordpress**

Using gui
