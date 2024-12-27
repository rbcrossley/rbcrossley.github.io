---
title: Configure three node (master-workers) kubernetes cluster using k3s
slug: kubernetes-cluster-k3s-master-worker-configuration
added: 2023-12-27
description: 
layout: ../layouts/BlogPost.astro
---
## Infrastructure
OS used: Rocky linux 9.5 minimal with a bridged adapter networking and static IP configured.
- Master(192.168.1.69)
- Worker-1(192.168.1.36)
- Worker-2(192.168.1.71)
- For rancher(192.168.1.35)
## Install k3s at master
```
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=v1.26.11+k3s1 sh -s - server --write-kubeconfig-mode 666
```
Note: (Rancher v2.8.1 is only compatible with k3s<=v1.27).
Do this on only the master server. Worker server will be set up later on differently.
## Edit `/etc/hosts` at master and workers
```
cat <<EOF >> /etc/hosts
192.168.1.69    master
192.168.1.36    worker1
192.168.1.71    worker2
EOF
```
## Configure firewalld and selinux
Or just disable it!
```
sed -i 's/enforcing/disabled/g' /etc/selinux/config /etc/selinux/config && systemctl disable --now firewalld
```
Reboot all servers once.
## Install k3s on worker nodes
Run this procedure on worker1 and worker2.
```
curl -sfL https://get.k3s.io | K3S_URL=https://192.168.1.69:6443 K3S_TOKEN="K105360d9c0f9d538b7934104834a719dc4998a230b662c3c576598d86515898117::server:03b803166743396ba31256db28664519" INSTALL_K3S_VERSION=v1.26.11+k3s1 sh -
```
The k3s token is located at `/var/lib/rancher/k3s/server/token`.
At master, the k3s.yaml file is located at `/etc/rancher/k3s/k3s.yaml`. Replace the localhost ip with master's ip address.
```
sed -i 's/127.0.0.1/192.168.1.69/g' /etc/rancher/k3s/k3s.yaml /etc/rancher/k3s/k3s.yaml
```
## mysql datastore endpoint at master(optional)
Use the below script to make k3s's data across a Database. Run this as a script or with escape sequences if wanted to run from terminal.
```
dnf install mysql-server -y &&
sudo systemctl start mysqld && sudo systemctl enable mysqld &&
mysql_secure_installation <<EOF

y
nep@himalaya123#
nep@himalaya123#
y
y
y
y
EOF
```
**Note**: This script was asking to enter password manually this time(worked last time on alma linux 9).
https://stackoverflow.com/a/36916378

Inside the database:
```
CREATE DATABASE k3s;
CREATE USER 'k3s'@'%' IDENTIFIED BY 'k3s@1234';
GRANT ALL PRIVILEGES ON k3s.* TO 'k3s'@'%';
FLUSH PRIVILEGES;
```
Now append database endpoint at master's k3s systemd's service, `/etc/systemd/system/k3s.service`.
```
--datastore-endpoint="mysql://k3s:k3s@1234@tcp(192.168.1.69:3306)/k3s"
```
## Server setup for rancher
Disable selinux and firewalld in rancher server i.e `192.168.1.35`.
Supported rancher for our k3s version is 2.8.4 as per [this link](https://www.suse.com/suse-rancher/support-matrix/all-supported-versions/rancher-v2-8-1/)

Install docker with this script.
```
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce
sudo systemctl start docker && sudo systemctl enable docker
sudo systemctl status docker
```
Pull and run the docker image.
```
docker run -d --privileged -p 8888:443 --restart=unless-stopped --name rancher-nepal rancher/rancher:v2.8.4
```
You might have to follow these steps to make the rancher ui up and running if you're getting connection refused.
```
cat<<EOF >/etc/modules-load.d/modules.conf
iptable_nat
iptable_filter
EOF
```
Reboot.
Doesn't work?
Delete all images, containers and start fresh again.
```
docker stop $(docker ps -q) && docker rm $(docker ps -aq) && docker rmi $(docker images -q)
```
Make sure your rancher Virtual Machine box has 4GB RAM and 2 core CPUs to run smoothly. Otherwise, you will face lots of frustrations with it.
And here you go!
```
https://192.168.1.35:8888
```
![](../attachments/Pasted%20image%2020241227165458.png)
Now, follow the instruction provided by it to get password. Create a cluster. Rancher will provide instructions required for the nodes to join the cluster. I am not doing this because my machine is low-end. But I had done it in the past with my other box that I sold now.