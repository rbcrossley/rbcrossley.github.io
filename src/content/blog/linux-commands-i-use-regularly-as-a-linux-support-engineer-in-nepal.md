---
title: Linux Commands that I use regularly as a Production Linux Support Engineer in Nepal
description: Tried and tested in production
date: 2026-09-08
author: BerojgarEngineer
image: /images/blog/commands.jpg
---

# Find a string in the neighborhood of another string

This scenario is very useful in log searching. Say your requirement is that you want to find a log file which contains "string1" and "string2" but within, say, 10 lines of "string1". This will greatly reduce the time wasted checking all the logs.

```
find . -exec bash -c 'zgrep -C20 "search_term_1" {} | grep -q "search_term_2" && echo {}' \;
```

This will output file names.

A faster version of this, why is it faster? (TBD)

```
find . -name "*.gz" -type f -exec bash -c 'for arg; do zgrep -C20 "search_term_1" "$arg" | grep -q "search_term_2" && echo "$arg"; done' dummy {} +
```

# Sort by first column name

You want to sort the output of a disk usage command by size.

```
du -sc * | sort -s -n -k 1,1
```

# Transfer files from Windows to a Linux VM

```
sftp://user@ipaddress:port
```

No need to insert a port if port 22 is being used.

Example:
```
sftp://root@10.20.30.11
```

# Give execute permissions to every file in a directory

```
chmod -R 777 .
```

# ACL to be able to upload files to a directory using FTP

```
setfacl -m u:username:rwX /path/to/the/directory/that/i/want/to/upload/a/file
```

Better idea is to just dump to `/tmp` directory from ftp(windows) and transfer from there.

# Find logs between two time durations

This is by far the most used command in my day to day life.

```
LC_ALL=C awk -v beg=12:15:00 -v end=13:00:00 '
  match($0, /[0-2][0-9]:[0-5][0-9]:[0-5][0-9]/) {
    t = substr($0, RSTART, 8)
    if (t >= end) selected = 0
    else if (t >= beg) selected = 1
  }
  selected' name_of_log_file
```

This finds the logs between two time durations where the time is in the form `HH:MM:SS`.

Thanks to ChatGPT for a more advanced version of this command which is easier to use.

```bash
#!/bin/bash

# Check if three arguments are provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <beg_time> <end_time> <log_file>"
    exit 1
fi

beg=$1
end=$2
log_file=$3

LC_ALL=C awk -v beg="$beg" -v end="$end" '
  match($0, /[0-2][0-9]:[0-5][0-9]:[0-5][0-9]/) {
    t = substr($0, RSTART, 8)
    if (t >= end) selected = 0
    else if (t >= beg) selected = 1
  }
  selected' "$log_file"
```

**Thanks to StackExchange for a more advanced version of this script. This will collect only the part of the file between two time durations, directly from a `.log.gz` file.**

```bash
#!/bin/bash

# Check if three arguments are provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <beg_time> <end_time> <log_file_gzipped>"
    exit 1
fi

beg=$1
end=$2
log_file_gzipped=$3

zcat "$log_file_gzipped" | LC_ALL=C awk -v beg="$beg" -v end="$end" '
  match($0, /[0-2][0-9]:[0-5][0-9]:[0-5][0-9]/) {
    t = substr($0, RSTART, 8)
    if (t >= end) selected = 0
    else if (t >= beg) selected = 1
  }
  selected'
```

**Thanks to myself for writing a modularized version of this code.**

```bash
#!/bin/bash

# Check if three arguments are provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <beg_time> <end_time> <log_file_gzipped>"
    exit 1
fi

beg=$1
end=$2
log_file_gzipped=$3

function non_gzipped() {
    LC_ALL=C awk -v beg="$beg" -v end="$end" '
  match($0, /[0-2][0-9]:[0-5][0-9]:[0-5][0-9]/) {
    t = substr($0, RSTART, 8)
    if (t >= end) selected = 0
    else if (t >= beg) selected = 1
  }
  selected' "$log_file_gzipped"
}

function gzipped() {
    zcat "$log_file_gzipped" | LC_ALL=C awk -v beg="$beg" -v end="$end" '
  match($0, /[0-2][0-9]:[0-5][0-9]:[0-5][0-9]/) {
    t = substr($0, RSTART, 8)
    if (t >= end) selected = 0
    else if (t >= beg) selected = 1
  }
  selected'
}

if [[ "$log_file_gzipped" == *.gz ]]; then
    gzipped
else
    non_gzipped
fi
```

**Future improvement for this script: grab the time format from any type of file and implement this script generically, I mean it is a bit not good programming style but who cares lol.**

# Gzip all logs in the current directory and save them to a different file

```
gzip *
```

# Gzip a directory

```
tar -zcvf archive.tar.gz directory/
```

# Unzip a directory

```
tar -zxvf archive.tar.gz
```

# Gzip all logs in a current directory except one named application.log

```
find . -maxdepth 1 -mindepth 1 ! -name 'application.log' -exec gzip {} \;
```

This will gzip each file to a separate archive.

# Empty a file

```
echo > catalina.out
OR
> catalina.out
```

Both will do the same thing.

# Find the biggest single file in the entire directory tree

```
find . -type f -printf "%s\t%p\n" | sort -n | tail -4
```

This will show the top 4 biggest files.

```
-n, --numeric-sort
compare according to string numerical value
```

# Copying multiple files to take a backup using cp

If all the files have the same extension:

```
cp *.conf config_backup
```

If the files don't have the same extension:

```
cp file.conf file2.conf file3.conf backuppedconf
```

`backuppedconf` will contain all three files.

# Search logs across multiple months

```
grep -lw -e 'string_to_search' name_of_log_2023-0[7-9]-*
```

# Split a large file into smaller pieces and store them in /tmp

```
split -n 20 name_of_log.log /tmp/smallfile
```

This will split the file named `name_of_log.log` into 20 different pieces and save them into `/tmp/smallfile` as `smallfileaa smallfileab ...`

# Recursively search .gz files for a string

```
find . -mtime -15 -name "*.gz" -exec zgrep -lH "string" {} \;
```

`-` means younger than 15 days and `+` means older than 15 days.

# Recursively search for text files

```
grep -rlw . -e 'string_to_search'
```

# Save the output of a tailed log to a file

```
tail -f application.log | tee -a /tmp/log
```

`tee` will save STDIN to a file and also send it to STDOUT (without `-a` it will overwrite any existing file).

This is yet another one of the most used commands in my day-to-day life for capturing real-time logs.

# Insert a new line after each date in a log file (new paragraph per timestamp)

```
:%s/\d\{4}-\d\{2}-\d\{2} \d\{2}:\d\{2}:\d\{2}/\r&/
OR
:%s/\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d/\r&/
```

The date format being:

```
2023-11-26 14:14:14
```

To do this without using the vi editor, use this command:

```
sed -e 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\} [0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}/\n&/' input > /tmp/output
```

# SSH Tunneling

```
ssh -p <SSH port> -L <Forwarded port>:<Remote server>:<Remote port> <SSH login>@<SSH server>
```

# Apply permissions to files with the same extension at once

```
find /images/. -name "*.jpg" -exec chmod 0644 {} \;
```

# Highlight multiple strings in the less editor

```
/foo|bar
```

# Search for an exact word match in the vi editor

```
/\<FOO\>
```

# Case-insensitive search in less/vi editor

Just add `\c` at the end.

```
/copyright\c
```

# List only directories in the current directory

```
ls -d */
```

# Back up all files except some folders

```
rsync --archive --exclude /logs /home/username/project/ /home/username/project_backup
```

To exclude multiple directories, do this:

```
rsync --archive --exclude={'logs/','generated*/','osgi*/'} . ~/admin_bak_oct_10_2023
```

Note: Use relative paths with `--exclude`. The paths are relative to the source directory.

# Command to export container images from one server to another

```
/usr/local/bin/ctr image export /tmp/image.tar registry.example.com/app/name:tag
```

If you get an error like this:

```
Error syncing pod ... CreatePodSandboxError: failed to get sandbox image "docker.io/rancher/pause:3.1":
failed to pull image "docker.io/rancher/pause:3.1": failed to resolve reference: TLS handshake timeout
```

Use this command to import the image on the target server instead:

```
cd /path/to/exported/image
ctr image import pause31.tgz
# unpacking docker.io/rancher/pause:3.1 (sha256:...)...done
```

# Remove all spaces from filenames in a directory

```
find . -name '*.jpg' -exec bash -c 'mv "$0" "${0// /_}"' {} \;
```

# Logrotate example

```
/path/to/app/logs/*.out {
        su appuser appgroup
        daily
        copytruncate
        missingok
        rotate 7
        compress
        dateext dateformat -%Y-%m-%d
}

/path/to/app/logs/archived/service-name/*.log {
        su appuser appgroup
        daily
        copytruncate
        missingok
        rotate 7
        compress
        dateext dateformat -%Y-%m-%d
        sharedscripts
        postrotate
            /path/to/app/bin/shutdown.sh && /path/to/app/bin/startup.sh
        endscript
}
```


# Auto-restart a Java module if it hangs (based on log inactivity)

```
*/5 6-21 * * * find '/var/app/module-name/logs/wrapper.log' -mmin +2 -exec /var/app/module-name/bin/service-name restart \;
```

# command to remove all docker containers, images, and have a fresh docker 

```
docker stop $(docker ps -q) && docker rm $(docker ps -aq) && docker rmi $(docker images -q)
```

# Bonus: SQL queries

# SQL query to find table name from column name

## MySQL
```sql
SELECT DISTINCT TABLE_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME LIKE ('%the_column_name%')
AND TABLE_SCHEMA = 'table_name';
```

## MS SQL
```sql
SELECT
    ColumnName = c.name,
    SchemaName = SCHEMA_NAME(t.schema_id),
    TableName = t.name
FROM 
    sys.columns c
INNER JOIN 
    sys.tables t ON t.object_id = c.object_id
WHERE
    c.name = 'your-column-name-here'
```

# SQL query to take a backup of a table

```sql
CREATE TABLE table_name_2023_09_03 SELECT * FROM table_name;
```

# Query to find all rows that have extra space within themselves

```sql
SELECT *
FROM table_name
WHERE column_name LIKE '%  %';
```