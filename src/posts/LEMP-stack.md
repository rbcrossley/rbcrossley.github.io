---
title: "Install wordpress on Rocky Linux 9 using NGINX as a webserver"
slug: "wordpress-LEMP-stack"
added: "2024-12-07"
description: ""
---
LEMP stack stands for:
- Linux
- Nginx(Engine X)
- MySQL
- PHP

LEMP stack can be used to create a wordpress site.

## Install the LEMP Stack

```
dnf install -y nginx mysql mysql-server php
```
Enable and start nginx
```
systemctl enable --now nginx.service
```

## Secure mysql installation

```
systemctl enable --now mysqld
```

```
mysql_secure_installation
```

Create an admin user

```
USE mysql;
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'adm!n';
FLUSH privileges;
```
## PHP and its extensions installation

```
sudo yum install -y epel-release
sudo dnf install -y php
sudo dnf install -y php-mysqlnd php-pgsql php-redis php-curl php-json php-gd php-xml php-mbstring php-zip
sudo systemctl enable --now php-fpm
```

## phpMyAdmin installation

```
wget https://files.phpmyadmin.net/phpMyAdmin/5.2.1/phpMyAdmin-5.2.1-all-languages.tar.gz
mv php* phpmyadmin
mv phpmyadmin /var/www/html/
/var/www/html/phpmyadmin consists of phpmyadmin file
sudo ln -s /var/www/html/phpMyAdmin /usr/share/nginx/html

sudo vi /var/www/html/phpmyadmin/config.inc.php


$cfg['blowfish_secret'] = ''; /* YOU MUST FILL IN THIS FOR COOKIE AUTH!Use openssl rand -base64 32 */

Add this line
$cfg['TempDir'] = '/tmp';

Now, create
/var/www/html/phpMyAdmin/tmp

chown -R nginx:nginx /var/www/html/phpmyadmin/ && sudo chmod 755  /var/www/html/phpmyadmin/
```


## NGINX configuration 

`/etc/nginx/conf.d/phpmyadmin.conf`
```
server {
        listen 80;
          server_name 10.13.161.50;

        location /phpmyadmin{
         root /var/www/html/;
          index index.php index.html index.htm index.nginx-debian.html;

          access_log /var/log/nginx/phpmyadmin_access.log;
          error_log /var/log/nginx/phpmyadmin_error.log;

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
## config.inc.php
This can give trouble.

```
<?php
/**
 * phpMyAdmin sample configuration, you can use it as base for
 * manual configuration. For easier setup you can use setup/
 *
 * All directives are explained in documentation in the doc/ folder
 * or at <https://docs.phpmyadmin.net/>.
 */

declare(strict_types=1);

/**
 * This is needed for cookie based authentication to encrypt the cookie.
 * Needs to be a 32-bytes long string of random bytes. See FAQ 2.10.
 */
$cfg['blowfish_secret'] = 'Oz4L/VoEwo5E/D1p3Fyc7ucJle1N6Wzu+FU7KerPRIQ'; /* YOU MUST FILL IN THIS FOR COOKIE AUTH! */

/**
 * Servers configuration
 */
$i = 0;

/**
 * First server
 */
$i++;
/* Authentication type */
$cfg['Servers'][$i]['auth_type'] = 'cookie';
/* Server parameters */
$cfg['Servers'][$i]['host'] = 'localhost';
$cfg['Servers'][$i]['compress'] = false;

    $cfg['Servers'][$i]['auth_type'] = 'config';
    $cfg['Servers'][$i]['user'] = 'root';
    $cfg['Servers'][$i]['password'] = 'root';
    $cfg['Servers'][$i]['extension'] = 'mysqli';
    $cfg['Servers'][$i]['AllowNoPassword'] = true;
    $cfg['Lang'] = '';

/**
 * phpMyAdmin configuration storage settings.
 */

/* User used to manipulate with storage */
// $cfg['Servers'][$i]['controlhost'] = '';
// $cfg['Servers'][$i]['controlport'] = '';
// $cfg['Servers'][$i]['controluser'] = 'pma';
// $cfg['Servers'][$i]['controlpass'] = 'pmapass';

/* Storage database and tables */
// $cfg['Servers'][$i]['pmadb'] = 'phpmyadmin';
// $cfg['Servers'][$i]['bookmarktable'] = 'pma__bookmark';
// $cfg['Servers'][$i]['relation'] = 'pma__relation';
// $cfg['Servers'][$i]['table_info'] = 'pma__table_info';
// $cfg['Servers'][$i]['table_coords'] = 'pma__table_coords';
// $cfg['Servers'][$i]['pdf_pages'] = 'pma__pdf_pages';
// $cfg['Servers'][$i]['column_info'] = 'pma__column_info';
// $cfg['Servers'][$i]['history'] = 'pma__history';
// $cfg['Servers'][$i]['table_uiprefs'] = 'pma__table_uiprefs';
// $cfg['Servers'][$i]['tracking'] = 'pma__tracking';
// $cfg['Servers'][$i]['userconfig'] = 'pma__userconfig';
// $cfg['Servers'][$i]['recent'] = 'pma__recent';
// $cfg['Servers'][$i]['favorite'] = 'pma__favorite';
// $cfg['Servers'][$i]['users'] = 'pma__users';
// $cfg['Servers'][$i]['usergroups'] = 'pma__usergroups';
// $cfg['Servers'][$i]['navigationhiding'] = 'pma__navigationhiding';
// $cfg['Servers'][$i]['savedsearches'] = 'pma__savedsearches';
// $cfg['Servers'][$i]['central_columns'] = 'pma__central_columns';
// $cfg['Servers'][$i]['designer_settings'] = 'pma__designer_settings';
// $cfg['Servers'][$i]['export_templates'] = 'pma__export_templates';

/**
 * End of servers configuration
 */

/**
 * Directories for saving/loading files from server
 */
$cfg['UploadDir'] = '';
$cfg['SaveDir'] = '';
$cfg['TempDir'] = '/tmp';


/**
 * Whether to display icons or text or both icons and text in table row
 * action segment. Value can be either of 'icons', 'text' or 'both'.
 * default = 'both'
 */
//$cfg['RowActionType'] = 'icons';

/**
 * Defines whether a user should be displayed a "show all (records)"
 * button in browse mode or not.
 * default = false
 */
//$cfg['ShowAll'] = true;

/**
 * Number of rows displayed when browsing a result set. If the result
 * set contains more rows, "Previous" and "Next".
 * Possible values: 25, 50, 100, 250, 500
 * default = 25
 */
//$cfg['MaxRows'] = 50;

/**
 * Disallow editing of binary fields
 * valid values are:
 *   false    allow editing
 *   'blob'   allow editing except for BLOB fields
 *   'noblob' disallow editing except for BLOB fields
 *   'all'    disallow editing
 * default = 'blob'
 */
//$cfg['ProtectBinary'] = false;

/**
 * Default language to use, if not browser-defined or user-defined
 * (you find all languages in the locale folder)
 * uncomment the desired line:
 * default = 'en'
 */
//$cfg['DefaultLang'] = 'en';
//$cfg['DefaultLang'] = 'de';

/**
 * How many columns should be used for table display of a database?
 * (a value larger than 1 results in some information being hidden)
 * default = 1
 */
//$cfg['PropertiesNumColumns'] = 2;

/**
 * Set to true if you want DB-based query history.If false, this utilizes
 * JS-routines to display query history (lost by window close)
 *
 * This requires configuration storage enabled, see above.
 * default = false
 */
//$cfg['QueryHistoryDB'] = true;

/**
 * When using DB-based query history, how many entries should be kept?
 * default = 25
 */
//$cfg['QueryHistoryMax'] = 100;

/**
 * Whether or not to query the user before sending the error report to
 * the phpMyAdmin team when a JavaScript error occurs
 *
 * Available options
 * ('ask' | 'always' | 'never')
 * default = 'ask'
 */
//$cfg['SendErrorReports'] = 'always';

/**
 * 'URLQueryEncryption' defines whether phpMyAdmin will encrypt sensitive data from the URL query string.
 * 'URLQueryEncryptionSecretKey' is a 32 bytes long secret key used to encrypt/decrypt the URL query string.
 */
//$cfg['URLQueryEncryption'] = true;
//$cfg['URLQueryEncryptionSecretKey'] = '';

/**
 * You can find more configuration options in the documentation
 * in the doc/ folder or at <https://docs.phpmyadmin.net/>.
 */
```
## Browse phpmyadmin web panel

Make sure firewalld and selinux are configured appropriately or disabled.

### Troubleshooting

```
2024/12/06 22:08:59 [error] 14086#14086: *14 FastCGI sent in stderr: "Unable to open primary script: /var/www/html//phpmyadmin/index.php (Permission denied)" while2024/12/06 22:17:19 [error] 14163#14163: *1 FastCGI sent in stderr: "Unable to open primary script: /var/www/html//phpmyadmin/index.php (Permission denied)" while reading response header from upstream, client: 192.168.1.70, server: 192.168.1.80, request: "GET /phpmyadmin/ HTTP/1.1", upstream: "fastcgi://unix:/run/php-fpm/www.sock:", host: "192.168.1.80"
2024/12/06 22:17:19 [error] 14163#14163: *1 FastCGI sent in stderr: "Primary script unknown" while reading response header from upstream, client: 192.168.1.70, server: 192.168.1.80, request: "GET /favicon.ico HTTP/1.1", upstream: "fastcgi://unix:/run/php-fpm/www.sock:", host: "192.168.1.80", referrer: "http://192.168.1.80/phpmyadmin/"

 reading response header from upstream, client: 192.168.1.70, server: 192.168.1.80, request: "GET /phpmyadmin/ HTTP/1.1", upstream: "fastcgi://unix:/run/php-fpm/www.sock:", host: "192.168.1.80"
```

https://serverfault.com/questions/517190/nginx-1-fastcgi-sent-in-stderr-primary-script-unknown

```
Wrong permissions on configuration file, should not be world writable!
```
```
chmod -R 755 /var/www/html/phpmyadmin/
```

Create a blog user with password "b10g".

## Install wordpress

```
wget https://wordpress.org/latest.zip
```
unzip

```
mv wordpress/ /var/www/html/
```
Update the phpmyadmin.conf

`/etc/nginx/conf.d/phpmyadmin.conf`

```
server {
        listen 80;
          server_name 192.168.1.80;

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