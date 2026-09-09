---
title: Linux Commands that I use regularly as a Production Linux Support Engineer in Nepal
description: Linux commands I use as a production support engineer in Nepal for logs, disk usage, file transfers, services, networking, troubleshooting, and daily work.
date: 2026-09-08
author: BerojgarEngineer
image: /images/blog/commands.jpg
---

Every Linux tutorial teaches you `ls`, `cd`, `grep` and `chmod`. Almost none of them teach you what you actually spend your day doing in production support, which is finding one error in a 4 GB compressed log file while someone from the business team asks for an update every ten minutes.

These are the commands I reached for regularly over more than two years supporting production Linux servers in Nepal's fintech sector. They are not organised by topic or by difficulty. They are organised by how often a real incident needed them, which is a different and more useful ordering.

For each one I have explained not just the syntax but the situation that produces it, because the syntax is easy to look up and the situation is what tells you which command you need.

**Who this is for:** anyone working in or heading towards a Linux support, DevOps or system administration role. If you are preparing for a support engineer interview, the log searching and disk usage sections are where most technical questions land.

# Log searching

This is where most of a support engineer's day goes. Everything else is occasional; this is constant.

## Find a string in the neighborhood of another string

This scenario is very useful in log searching. Say your requirement is that you want to find a log file which contains "string1" and "string2" but within, say, 10 lines of "string1". This will greatly reduce the time wasted checking all the logs.

The situation that produces this: a transaction failed, you have a reference number, and you need the error that accompanied it. Searching for the reference number alone returns hundreds of harmless matches across months of archives. Searching for the error alone returns thousands. What you want is the file where both appear close together, because proximity in a log file usually means causation.

```
find . -exec bash -c 'zgrep -C20 "search_term_1" {} | grep -q "search_term_2" && echo {}' \;
```

This will output file names.

Breaking it down: `zgrep -C20` searches inside gzipped files and prints 20 lines of context around each match. That context is then piped to `grep -q`, which is quiet mode, producing no output and only setting an exit status. If the second term is found within that context window, `&&` fires and the filename is printed.

A faster version of this:

```
find . -name "*.gz" -type f -exec bash -c 'for arg; do zgrep -C20 "search_term_1" "$arg" | grep -q "search_term_2" && echo "$arg"; done' dummy {} +
```

The speed difference comes from `+` instead of `\;` at the end. With `\;`, `find` starts a brand new `bash` process for every single file. On a directory holding two thousand rotated logs, that is two thousand process launches, and process creation is expensive. With `+`, `find` batches as many filenames as will fit into one command line and launches `bash` once per batch. The `for arg; do ... done` loop inside then iterates over that batch.

The word `dummy` is there because when `bash -c` runs a command string, the first argument after it becomes `$0`, the script name, not `$1`. Without a placeholder, `find` would pass a real filename into the `$0` slot and that file would be silently skipped. `dummy` absorbs that position.

Adding `-name "*.gz" -type f` also helps by not attempting to search directories and uncompressed files.

## Find logs between two time durations

This is by far the most used command in my day to day life.

The scenario is universal in support work: the business tells you something broke "around 12:30". The log file covers a full day and is several hundred megabytes. You need the fifteen minutes on either side, not the whole file.

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

The clever part of this script is what happens to lines with no timestamp. A Java stack trace is dozens of lines long and only the first carries a time. This script uses a `selected` flag that is only updated when a line contains a timestamp, and every subsequent line inherits it. That means stack traces come through complete rather than being decapitated, which is precisely what you need since the stack trace is the part you actually want to read.

`LC_ALL=C` forces byte-wise string comparison instead of locale-aware collation. It makes the comparison both faster and predictable, since locale rules can produce surprising ordering.

The comparison works at all because `HH:MM:SS` in a fixed width, zero padded format sorts identically as a string and as a time. `09:30:00` is less than `12:15:00` as plain text. This is also the limitation: the script cannot span midnight, because `23:59:59` is greater than `00:00:01` as a string.

A more convenient version taking the times and filename as arguments:

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

**A version that reads directly from a `.log.gz` file, so you do not have to decompress it first:**

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

Reading the compressed file directly matters more than it sounds. Decompressing a 2 GB archive to disk when the filesystem is already at 90 percent is how a bad morning becomes a worse one.

**And a modular version that handles both compressed and uncompressed files automatically:**

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

The extension check is a reasonable heuristic but not a reliable one, since a gzipped file can be named anything. A more robust test asks the file itself what it is:

```bash
if file "$log_file" | grep -q gzip; then
```

The obvious improvement to this script is detecting the timestamp format automatically rather than assuming `HH:MM:SS`, so it works on logs using ISO-8601 or syslog style dates. That is a good exercise if you want to practise your `awk`.

## Search logs across multiple months

```
grep -lw -e 'string_to_search' name_of_log_2023-0[7-9]-*
```

`-l` prints only filenames rather than matching lines, which is what you want when narrowing down where to look. `-w` matches whole words only, so searching for `error` does not also return `errorCode` and `no_error`. The `[7-9]` is a shell glob character class covering July through September.

## Recursively search .gz files for a string

```
find . -mtime -15 -name "*.gz" -exec zgrep -lH "string" {} \;
```

`-` means younger than 15 days and `+` means older than 15 days.

That sign convention is worth committing to memory because getting it backwards is a common and confusing mistake. `-mtime -15` means modified less than 15 days ago; `-mtime +15` means more than 15 days ago. The time filter is doing real work here, cutting the search from years of archives to the window you care about.

`-H` forces `zgrep` to print the filename even when only one file matches, which keeps the output consistent.

## Recursively search for text files

```
grep -rlw . -e 'string_to_search'
```

`-r` recurses into subdirectories. If your server has `ripgrep` available, `rg` does the same job substantially faster on large trees, though on a locked down production box you will usually only have the standard tools.

## Save the output of a tailed log to a file

```
tail -f application.log | tee -a /tmp/log
```

`tee` will save STDIN to a file and also send it to STDOUT (without `-a` it will overwrite any existing file).

This is yet another one of the most used commands in my day-to-day life for capturing real-time logs.

The reason this matters is that during an incident you are watching the log scroll past while also needing a record of it afterwards for the incident report. `tee` gives you both from one command. The `-a` for append is important: without it, restarting your tail wipes the capture you were building.

A useful variation filters while capturing, so you watch only what matters but keep everything:

```bash
tail -f application.log | tee -a /tmp/log | grep -i error
```

## Highlight multiple strings in the less editor

```
/foo|bar
```

Once you are inside `less`, this highlights every occurrence of both terms, which makes patterns visible as you scroll. `less` is generally the right tool for large log files because it does not load the whole file into memory the way `vi` does.

## Search for an exact word match in the vi editor

```
/\<FOO\>
```

`\<` and `\>` are word boundary markers, the `vi` equivalent of `grep -w`.

## Case-insensitive search in less/vi editor

Just add `\c` at the end.

```
/copyright\c
```

## Insert a new line after each date in a log file (new paragraph per timestamp)

Some applications write logs as one continuous block with no separation between entries. Inserting a blank line before each timestamp turns that wall of text into readable paragraphs, one per log entry.

```
:%s/\d\{4}-\d\{2}-\d\{2} \d\{2}:\d\{2}:\d\{2}/\r&/
OR
:%s/\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d/\r&/
```

The date format being:

```
2023-11-26 14:14:14
```

The `&` in the replacement means "whatever was matched", so `\r&` inserts a carriage return followed by the original timestamp, preserving it.

To do this without using the vi editor, use this command:

```
sed -e 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\} [0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}/\n&/' input > /tmp/output
```

Prefer the `sed` version on large files, since `vi` has to load the entire file into memory and will struggle above a few hundred megabytes.

# Disk space and file sizes

Disk full is one of the most common production incidents, and it usually announces itself as something entirely unrelated: an application that will not start, a database refusing writes, or a service that stopped logging.

## Sort by first column name

You want to sort the output of a disk usage command by size.

```
du -sc * | sort -s -n -k 1,1
```

`du -sc` gives a summary per item plus a total. `sort -n` sorts numerically rather than alphabetically, which matters because alphabetically `9` comes after `1000`. `-k 1,1` restricts the sort key to the first field only.

In practice I usually want human readable sizes and only the biggest offenders:

```bash
du -sh * | sort -rh | head -20
```

`-h` on `du` gives sizes like `1.4G`, and `sort -rh` understands those suffixes and sorts in reverse, putting the largest first.

## Find the biggest single file in the entire directory tree

```
find . -type f -printf "%s\t%p\n" | sort -n | tail -4
```

This will show the top 4 biggest files.

```
-n, --numeric-sort
compare according to string numerical value
```

`-printf "%s\t%p\n"` outputs the size in bytes and the full path, tab separated, which is exactly the format `sort -n` wants.

**A caveat worth knowing.** If `df` says the disk is full but `du` cannot account for the space, the usual cause is a deleted file still held open by a running process. The directory entry is gone so `du` cannot see it, but the kernel keeps the blocks allocated until the process closes the handle. This happens constantly when someone deletes a large log that an application is still writing to.

```bash
lsof +L1
```

That lists open files with no remaining directory link. Restarting the offending process releases the space. This is exactly why `copytruncate` in logrotate exists, and it is a favourite interview question.

# Compression and archives

## Gzip all logs in the current directory

```
gzip *
```

Note that `gzip` replaces each original file with its compressed version rather than making a copy. On text logs, expect around 90 percent reduction.

## Gzip a directory

```
tar -zcvf archive.tar.gz directory/
```

`gzip` compresses single files only, so directories need `tar` to bundle everything into one stream first. The flags read as: `z` for gzip, `c` for create, `v` for verbose, `f` for the filename that follows.

## Unzip a directory

```
tar -zxvf archive.tar.gz
```

Same flags with `x` for extract. Worth running `tar -tzf archive.tar.gz | head` first to see what is inside, since not every archive politely puts its contents in a single top level directory.

## Gzip all logs in a current directory except one named application.log

```
find . -maxdepth 1 -mindepth 1 ! -name 'application.log' -exec gzip {} \;
```

This will gzip each file to a separate archive.

The exclusion exists because compressing the file an application is actively writing to will break its logging. `-maxdepth 1` keeps the operation in the current directory, and `-mindepth 1` stops `find` from matching the directory itself.

## Split a large file into smaller pieces and store them in /tmp

```
split -n 20 name_of_log.log /tmp/smallfile
```

This will split the file named `name_of_log.log` into 20 different pieces and save them into `/tmp/smallfile` as `smallfileaa smallfileab ...`

Useful when you need to email or transfer a log that exceeds an attachment size limit, or when a tool chokes on a file above a certain size. `split -l 100000` splits by line count instead, which keeps individual log entries intact.

Reassemble with `cat smallfile* > original.log`.

## Empty a file

```
echo > catalina.out
OR
> catalina.out
```

Both will do the same thing.

Not quite: `echo >` writes a single newline, leaving a 1 byte file, while `> file` truncates to exactly zero bytes. The difference rarely matters.

What does matter is why you truncate rather than delete. Deleting a log an application has open triggers the exact deleted-but-open problem described earlier: the space is not returned until the process restarts. Truncating keeps the file handle valid and frees the space immediately, which is why this is the correct way to reclaim space from a live log.

`> catalina.out` in particular is a Tomcat habit. That file grows without bound because Tomcat does not rotate it itself.

# File transfer, permissions and backup

## Transfer files from Windows to a Linux VM

```
sftp://user@ipaddress:port
```

No need to insert a port if port 22 is being used.

Example:
```
sftp://root@10.20.30.11
```

Paste that into WinSCP, FileZilla or Windows Explorer. SFTP runs over SSH, so if you can SSH to the server you can already transfer files to it with no extra service needed.

For scripted transfers, `scp` and `rsync` are better suited:

```bash
scp file.txt user@10.20.30.11:/tmp/
```

## Give execute permissions to every file in a directory

```
chmod -R 777 .
```

> **Do not use `777` on a production server.** It grants read, write and execute to every user on the system, including any service account a compromised application might be running as. It is also, in my experience, the single most common finding in a security audit.
>
> What you almost always actually want:
>
> ```bash
> chmod -R 755 .          # owner writes, everyone reads and executes
> chmod -R u+X .          # add execute only to directories, not files
> ```
>
> The capital `X` in that second command is the useful one. It applies execute permission only to directories and to files that already have it somewhere, which is nearly always the intent when someone reaches for `777`.

## ACL to be able to upload files to a directory using FTP

```
setfacl -m u:username:rwX /path/to/the/directory/that/i/want/to/upload/a/file
```

Better idea is to just dump to `/tmp` directory from ftp(windows) and transfer from there.

ACLs are the right tool when standard user/group/other permissions cannot express what you need, typically when two different users both require write access to the same directory but must not inherit each other's group. Rather than loosening permissions for everyone, an ACL grants one specific user exactly what they need.

`getfacl /path` shows the current ACLs. Note that a `+` at the end of the permission string in `ls -l` is how you spot that a file has ACLs set, which is easy to miss when troubleshooting a permissions problem.

## Copying multiple files to take a backup using cp

If all the files have the same extension:

```
cp *.conf config_backup
```

If the files don't have the same extension:

```
cp file.conf file2.conf file3.conf backuppedconf
```

`backuppedconf` will contain all three files.

The destination directory must already exist, or `cp` will interpret the last argument as a filename and behave in a way you did not intend.

Before editing any configuration file on a production server, take a timestamped copy. This habit has saved me more times than any other on this page:

```bash
cp nginx.conf nginx.conf.bak-$(date +%F-%H%M)
```

## Apply permissions to files with the same extension at once

```
find /images/. -name "*.jpg" -exec chmod 0644 {} \;
```

`0644` is correct for static content: the owner can write, everyone can read, and nobody can execute. Uploaded files should never be executable, since an executable file in a web-served directory is a straightforward path to remote code execution.

## Back up all files except some folders

```
rsync --archive --exclude /logs /home/username/project/ /home/username/project_backup
```

To exclude multiple directories, do this:

```
rsync --archive --exclude={'logs/','generated*/','osgi*/'} . ~/admin_bak_oct_10_2023
```

Note: Use relative paths with `--exclude`. The paths are relative to the source directory.

`--archive` is shorthand for a bundle of flags that preserve permissions, ownership, timestamps, symlinks and recursion. It is what you want for a backup, because a copy that loses ownership is not a restorable backup.

The trailing slash on the source path is `rsync`'s most notorious detail. `source/` copies the *contents* of source into the destination; `source` copies the directory itself into the destination, creating `destination/source/`. Both are valid, and confusing them is how you end up with nested duplicates.

Always dry run before a large sync:

```bash
rsync -avn --exclude 'logs/' source/ destination/
```

The `n` is `--dry-run`. It shows exactly what would be transferred without touching anything.

## Remove all spaces from filenames in a directory

```
find . -name '*.jpg' -exec bash -c 'mv "$0" "${0// /_}"' {} \;
```

`${0// /_}` is bash parameter expansion: replace every space with an underscore. The double slash means global replacement rather than just the first occurrence. Every variable is quoted here for the obvious reason that the filenames contain spaces, which is the whole problem being solved.

# Services, networking and containers

## SSH Tunneling

```
ssh -p <SSH port> -L <Forwarded port>:<Remote server>:<Remote port> <SSH login>@<SSH server>
```

This is one of the most useful things in this entire list, and it is worth understanding properly rather than copying.

The situation: a database or admin console runs on a production server and is deliberately not exposed to the network. You need to reach it from your laptop. Rather than opening a firewall port, you forward it through your existing SSH connection.

```bash
ssh -L 8080:localhost:4848 user@production-server
```

After that, `http://localhost:8080` on your machine reaches port 4848 on the server, with the traffic encrypted inside the SSH session. Nothing new is exposed to the network.

The middle hostname is resolved *from the server's perspective*, which is the part people get wrong. `-L 5432:db-internal:5432` reaches a database on a different host that only the jump server can see.

## Command to export container images from one server to another

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

This comes up constantly in Nepal, where production Kubernetes clusters frequently sit in air-gapped or restricted-egress networks with no route to Docker Hub. The workaround is to pull the image somewhere with internet access, export it to a tarball, move the tarball across, and import it on each node.

`ctr` is containerd's own CLI, which is what you use on a cluster that no longer runs Docker. Note that `ctr` is namespace-aware, so for Kubernetes images you usually need `-n k8s.io`, otherwise the import succeeds but the kubelet cannot see the image:

```bash
ctr -n k8s.io image import pause31.tgz
```

The `pause` image being the one that fails is telling: it is the tiny container that holds the network namespace for every pod, so nothing schedules without it.

## Command to remove all docker containers, images, and have a fresh docker

```
docker stop $(docker ps -q) && docker rm $(docker ps -aq) && docker rmi $(docker images -q)
```

> **This deletes everything.** Every container, running or stopped, and every image. Fine on a lab machine when you want a clean slate; catastrophic on a shared or production host. There is no confirmation prompt.

The modern equivalent, which is safer because it skips anything currently in use:

```bash
docker system prune -a
```

That one does prompt before proceeding, and reports how much space it reclaimed.

## List only directories in the current directory

```
ls -d */
```

The `*/` glob matches only directories, and `-d` tells `ls` to list the directory entries themselves rather than descend into them.

# Log rotation and automation

## Logrotate example

Log rotation is the difference between a server that runs for a year and one that fills its disk in three weeks. This is a real configuration, dropped into `/etc/logrotate.d/`:

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

The directives that matter:

**`copytruncate`** is the important one. Normally logrotate renames the log and expects the application to reopen it. Many Java applications hold the file handle open and keep writing to the renamed file, so the new log stays empty forever. `copytruncate` instead copies the contents and truncates the original in place, so the application's handle remains valid. If you are rotating logs for an application you did not write, this is usually the setting you want.

**`missingok`** stops logrotate erroring when a file does not exist, which is normal for an application that has not started yet.

**`rotate 7`** keeps seven generations and deletes the eighth. Set this against your actual retention requirement, which in banking is often regulated rather than discretionary.

**`compress`** gzips rotated logs, typically reclaiming around 90 percent of their space.

**`sharedscripts`** ensures the `postrotate` block runs once for the whole pattern rather than once per matched file. Without it, a pattern matching five files would restart the service five times.

Test a configuration without waiting a day for it to fire:

```bash
logrotate -d /etc/logrotate.d/yourconfig   # dry run
logrotate -f /etc/logrotate.d/yourconfig   # force run
```

## Auto-restart a Java module if it hangs (based on log inactivity)

```
*/5 6-21 * * * find '/var/app/module-name/logs/wrapper.log' -mmin +2 -exec /var/app/module-name/bin/service-name restart \;
```

Reading the cron expression: every 5 minutes, between 6 AM and 9 PM, every day. The `find` checks whether the wrapper log was modified more than 2 minutes ago (`-mmin +2`), and if so restarts the service.

The logic behind it is that a healthy application writes to its log continuously. Silence means it has hung, and a hung process often still looks alive to a simple process check, so log inactivity is a better liveness signal than "is the PID present".

> **This is a workaround, not a fix.** It is a reasonable stopgap while you investigate why the application hangs, and I have used it exactly that way. But it will also happily restart a healthy service during a quiet period, and it masks the underlying problem. If you deploy something like this, log every restart it performs so the frequency is visible, and treat a rising restart count as the incident it is.
>
> The same idea, done properly, is a systemd unit with `Restart=on-failure` combined with a real health check endpoint.

# Bonus: SQL queries

Support work regularly crosses into the database, usually to confirm whether a transaction actually landed. A few queries worth having ready.

## SQL query to find table name from column name

You have a column name from an error message or from application code, and no idea which table it belongs to. On a schema with hundreds of tables, this saves a long afternoon.

### MySQL
```sql
SELECT DISTINCT TABLE_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME LIKE ('%the_column_name%')
AND TABLE_SCHEMA = 'table_name';
```

`INFORMATION_SCHEMA` is the standard set of metadata views describing the database itself. `TABLE_SCHEMA` here means the database name, despite the variable in the example being called `table_name`.

### MS SQL
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

## SQL query to take a backup of a table

```sql
CREATE TABLE table_name_2023_09_03 SELECT * FROM table_name;
```

Run this before any manual `UPDATE` or `DELETE` on production data. It takes seconds and it is the only thing standing between you and an unrecoverable mistake.

Two caveats: this copies the data and column definitions but **not** the indexes, constraints or auto-increment settings, so it is a data snapshot rather than a true structural backup. And these tables accumulate, so date the name as shown here and clean them up afterwards.

Wrap any manual data change in a transaction so you can inspect the result before committing:

```sql
START TRANSACTION;
UPDATE table_name SET column = 'value' WHERE id = 123;
-- verify the row count is what you expected
COMMIT;   -- or ROLLBACK;
```

## Query to find all rows that have extra space within themselves

```sql
SELECT *
FROM table_name
WHERE column_name LIKE '%  %';
```

That pattern matches two consecutive spaces. Double spaces in data are a classic cause of failed lookups and mismatched joins, and they are invisible when you read the output. `TRIM()` and `REPLACE()` clean them up once you have found them.

# What to actually take away from this

If you learn nothing else from this list, learn the log searching section. Being able to extract a fifteen minute window from a compressed multi-gigabyte log, with stack traces intact, is the single most valuable practical skill in production support. It is what turns a two hour investigation into a five minute one.

Beyond that, three habits matter more than any individual command:

**Back up before you change anything.** A timestamped copy costs one second and has saved me more times than I can count.

**Understand why the command works, not just that it does.** Knowing that `-exec ... +` batches while `\;` does not is what lets you fix the command when the situation is slightly different, and situations are always slightly different.

**Be suspicious of the convenient option.** `chmod 777`, disabling SELinux and `docker rmi $(docker images -q)` all solve the immediate problem. They also all create a bigger one. There is nearly always a precise alternative that costs one extra minute.

I add to this list as I hit new problems. If there is a command that keeps saving you and it is not here, I would genuinely like to hear about it.
