---
title: Linux Commands that I use regularly as a Production Linux Support Engineer in Nepal
description: Linux commands I use as a production support engineer in Nepal for logs, disk usage, file transfers, services, networking, troubleshooting, and daily work.
date: 2026-09-08
author: BerojgarEngineer
image: /images/blog/commands.jpg
tags: ["Linux commands", "Linux support engineer", "production support", "troubleshooting", "system administration", "shell commands", "log analysis", "disk usage", "rsync", "scp", "systemd services", "networking commands"]
categories: ["linux"]
---

These are the commands I reached for regularly over more than two years supporting production Linux servers in Nepal. They are not organised by topic or by difficulty. They are organised by how often a real incident needed them, which is a different and more useful ordering.

For each one I have explained not just the syntax but the situation that produces it, because the syntax is easy to look up and the situation is what tells you which command you need.



What do I mean by a Linux Support Engineer?

Honestly, this differs from company to company, country to country and so on.

As a linux support engineer, I have worked with Applications deployed on Linux and kubernetes(where kubernetes was deployed on Linux). My work experience is around 3 years.

Most of my experience comes from working in Red Hat based system. Couple of years ago, it was centos 7, then it was Rocky Linux 9. Nowadays, I also get to work with Ubuntu server 22.04 and 24.04.

This is my first video in the series of linux commands.

I will not list commands after commands without any reason. I do not want to claim that the commands that are used by me frequently are the commands that will be used by you frequently.

I also do not claim that I wrote these commands on my own. Most of them, I googled and found somewhere, while some I used chatgpt back then. 

And some of them, I might have edited myself as well to customize for my particular scenario. All that I claim is that I understand bash scripts and linux command line upto the intermediate level.

I will list the commands on the descending order of usage. The first command in this series is the one mostly used by me.
# Find logs between two time durations
I have a multi-node kubernetes cluster.

The application is deployed on kubernetes.

The application throws application logs in the node that it is currently running.

The logs are not yet centralized. This is in Nepal which is at the primitive stage in technology, maybe that is why. Plus the scale of users is not that high so few nodes are enough and that does not warrant a centralized logging system.

The problem: Customer faces an issue and you have to verify through the logs what actually might have happened.

If you are lucky, the specific logs will also be stored in some form on the database. And you can just throw a SQL query for checking the logs in structured fashion.

But usually it is an unlucky day. 

The only way is to check the logs stored in the node where that microservice's pod is currently running.

So first you go to the kubernetes UI like rancher and find in which node is the pod for specific microservice currently running. 

Then you go to that specific node.

And if the issue happened yesterday, that log will be in compressed format like gzip.

And sometimes the application might have ran in multiple nodes in the same day.

But all these issues is remedied if we can somehow find the actual time when the activity was performed by our customer.

There are various ways to find that time:
- A database lookup
- Asking with the customer
This is pretty doable.

Once the time is found, we need to visit the node at which the pod was running at that time.

To ensure that we are in correct pod:

```
find . -exec zgrep "keyword" {} \;
```
This reports the keyword is present in the current directory (which is the directory where the compressed logs are stored).

zgrep is used to ensure it searches the compressed logs.

We need to insert this command on all nodes that the application is deployed into. 

Once it reports a success in a specific node, or we niche out the specific node via analysis, then we can proceed forward.

Now our goal is to pick the customer's logs for the specific time duration. The customer might have performed the activity at 10:28 AM. 

We want to ensure that we get all the logs of the customer between 10:20:00 AM to 10:35:00 AM.

Now depending on the time format specified in the logs, we can curate the script. For my case, it was HH:MM:SS. And this was the script that I used. 

Disclaimer: The script is not following the best programming practices because I am not an experienced programmer and bash is not a programming language. But it did the job for me. You are welcome to modify it and share the modified script in comments. I have not edited this because it is a script that I modified myself and do not want to use AI for it.

```
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
What it does is simple and self-explanatory. You can even feed this into AI to learn what it is doing.
I will not bother explaining it here.

# Recursively search for text files

```
grep -rlw . -e 'string_to_search'
```

`-r` recurses into subdirectories. This is useful for finding where in the configuration files certain configs are present.

## Save the output of a tailed log to a file


This one is really simple command. Yet very useful command.

The scenario that demands this command is that when you are debugging in real time. The customer is attempting an activity at real time, you are reading the logs. You want to ensure that the logs are saved while being able to see the latest logs on screen as well.

To see the latest logs, you would do something like;

```
tail -f app.log
```
Now to save it to a file while seeing it live in screen, you have to do something like:
```
tail -f app.log| tee /tmp/log.txt
```
This will save the contents that are being tailed to /tmp/log.txt. 

This is very handy for coordinating with developers based on my experience. As most of the real time debugging happens with developers on the side.

# vi and less

Skills of text viewer and editor are very useful as a linux support engineer.

- Highlight multiple strings in the less editor

```
less file.log

/foo|bar
```


- Search for an exact word match in the vi editor

```
/\<FOO\>
```

- Case-insensitive search in less/vi editor

Just add `\c` at the end.

```
/copyright\c
```

- Insert a new line after each date in a log file (new paragraph per timestamp)

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

To do this without using the vi editor, use this command:

```
sed -e 's/[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\} [0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}/\n&/' input > /tmp/output
```

Prefer the `sed` version on large files, since `vi` has to load the entire file into memory and will struggle above a few hundred megabytes.

# Disk space and file sizes

- Problem: Find the culprits for disk full

You do the df -H command and find that the disk is full in /opt partition.

Assume that this is unusual. So you want to find the culprit file/files. You first go to the /opt directory and execute this command.

```
find . -type f -printf "%s\t%p\n" | sort -n | tail -4
```
It lists the files.
It prints the file size in bytes, and file paths. 
`\t and \n` are used for formatting(tab and new line).

sort `-n` will sort the files numerically based on the first column. And the first column is file size in bytes. 

It will sort in ascending order.

tail command gives the last n lines. Which is here the last 4 lines. Since sorting is done in ascending order, tail will list the 4 top largest files.


# Compression and archives
Once you find the disk is full due to some log files, you have to compress those logs files (or delete them if that is allowed by regulations).

- Gzip all logs in the current directory

```
gzip *
```

Note that `gzip` replaces each original file with its compressed version.


- Gzip a directory

```
tar -zcvf archive.tar.gz directory/
```

- Unzip a directory

```
tar -zxvf archive.tar.gz
```

- Gzip all logs in a current directory except one named application.log

This is useful in scneario where you do not want to archive the currently running application log file.

```
find . -maxdepth 1 -mindepth 1 ! -name 'application.log' -exec gzip {} \;
```

## Empty a file

I use this heavily in local hobby project environment. I have a file that I want to empty. Opening the file with vi and manually cleaning the file is also a way if the file is small enough.

But some configuration files or useless log files can be too large for manual clearing to be feasible.

That is when the below command is useful.

```
echo > catalina.out
```

This will empty the log file named catalina.out.



# Problem: Backup some files except some folders
This situations comes in a scenario while migrating from one server to another. I get that there can be various ways of back up and migration. What I am going to discuss is just one approach of backup and migration.

You have some specific application server that has huge application logs. The application logs are in tens of GBs.

You want to migrate the application server but you do not want to take the application logs in the new server.

In that case you can use rsync command like this:

```
rsync --archive --exclude={'logs/','generated*/','osgi*/'} /home/username/project ~/project_bak_oct_10_2026
```
This will create an archive(it will not compress anything) of everything except logs, anything starting with generated, and anything started with osgi in the /home/username/project directory and create the backup in ~/project_back_oct_10_2026,

I have heard good benefits of using rsync for backup. You can look upto them in claude or chatgpt.

Thank you for reading so far. If you have faced similar situations in production, share it w ith me https://berojgarengineer.com/contact/.



