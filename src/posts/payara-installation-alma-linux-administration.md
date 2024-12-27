---
title: Payara Server Installation, Configuration and Administration in Alma Linux 9
slug: payara-installation-in-alma-linux-and-payara-administration-configuration
added: 2024-12-20
description: ""
layout: ../layouts/BlogPost.astro
---

Bash script to setup payara server for deployment.(I've only tested this script in bits and pieces not as a whole)

```
# one time installations
if [[ $(rpm -qa| grep -w 'wget'|wc -l) -eq 0]]; then
dnf install -y wget;
fi

if [[ $(rpm -qa| grep -w 'unzip'|wc -l) -eq 0]]; then
dnf install -y unzip;
fi

# Disable selinux
sed -i 's/enforcing/disabled/g' /etc/selinux/config /etc/selinux/config

# Disable firewalld
systemctl disable --now firewalld

# add glassfish "fish" user with a password
useradd fish 
passwd fish << EOF
f!sh@glass
f!sh@glass
EOF

# Allow sudo for fish user and passwordless sudo authentication
cat <<EOF >> /etc/sudoers
fish ALL=(ALL) NOPASSWD: ALL 
EOF
 
# switch user to fish user from root user.
su - fish 
# install java jdk
curl -s "https://download.oracle.com/java/23/latest/jdk-23_linux-x64_bin.tar.gz"| tar xvzf - -C /tmp
mv /tmp/jdk* ~/.java

# Bash profile changes
cat << EOF >> ~/.bash_profile
PATH=$PATH:$HOME/.local/bin:$HOME/bin
export JAVA_HOME=/home/fish/.java
export PATH=/home/fish/.java/bin:$PATH
export PATH
EOF

source ~/.bash_profile

# Install payara
## For some reason I can't install payara server from command line, so I expect to have manually downloaded payara server and put it in /tmp.

unzip payara*.zip && mv payara?? ~/payara

# Unit service file for glassfish
sudo tee /etc/systemd/system/payara.service > /dev/null << EOF 
[Unit]
Description = GlassFish Server v4.1
After = syslog.target network.target

[Service]
User=fish
Group=fish
ExecStart = /home/fish/.java/bin/java -jar /home/fish/payara/glassfish/lib/client/appserver-cli.jar start-domain
ExecStop = /home/fish/.java/bin/java -jar /home/fish/payara/glassfish/lib/client/appserver-cli.jar stop-domain
ExecReload = /home/fish/.java/bin/java -jar /home/fish/payara/glassfish/lib/client/appserver-cli.jar restart-domain
Type = forking

[Install]
WantedBy = multi-user.target
EOF

# Enable the systemd service
sudo systemctl enable --now payara

# Payara Configuration (optional)
./home/fish/payara/bin/asadmin change-admin-password << EOF
admin

root@Nepal
root@Nepal
EOF


./home/fish/payara/bin/asadmin enable-secure-admin << EOF
admin
root@Nepal
EOF
# restart payara, might require root
sudo systemctl restart payara 

./home/fish/payara/bin/asadmin create-domain --portbase 5000 a <<EOF

EOF
```

## Payara server administration

**Starting a domain**

./home/fish/payara/bin/asadmin start-domain a


**Deleting a domain**

./home/fish/payara/bin/asadmin delete-domain -port 5048 a

**Undeploying and Deploying an application**

./asadmin --port 4848 undeploy application_name
(application_name is located at /home/fish/payara/glassfish/domains/a/applications/__internal)

./asadmin --port 4848 deploy /tmp/application_name*.ear

**Force deploy an application**
./asadmin --port 4848 deploy --force=true /tmp/application_name*.ear


Shell script to restart one or more payara server domains.

```
# Restart domains shell script
## bash restart-payara-domain.sh domain1 a
for var in "$@"
do
    ./home/fish/payara/bin/asadmin restart-domain "$var"
done
```

### References:
- Heredocs
 - https://linuxize.com/post/bash-heredoc/
 - https://docs.vultr.com/how-to-use-bash-heredoc
 - https://stackoverflow.com/a/2954835

- One time installations
 - https://stackoverflow.com/questions/13086109/check-if-bash-variable-equals-0
 - https://stackoverflow.com/questions/15108229/how-to-count-number-of-words-from-string-using-shell
 - https://stackoverflow.com/questions/669452/are-double-square-brackets-preferable-over-single-square-brackets-in-b

-  curl 
 - https://explainshell.com/explain?cmd=curl+-s+
 - https://unix.stackexchange.com/a/429818
 - https://stackoverflow.com/a/79101773
 
- selinux
 - https://github.com/mdichirico/public-shell-scripts/blob/master/disable-selinux-on-cent-os-7.sh 

- sudo cat doesn't work
 - https://stackoverflow.com/a/4414785
 
- iterate over input arguments bash
 - https://stackoverflow.com/a/255913
