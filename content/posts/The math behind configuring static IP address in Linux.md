---
title: "The math behind configuring static IP address in Linux"
date: 2024-04-08
draft: false
ShowToc: true
---

### Objectives

- Learn how to configure static IP in linux while connecting to the internet.
- Learn the math behind setting up IP Address.
  This will work on Red-Hat based distros. This was tested on Rocky Linux 9.

## Step 1: Take a fresh VM

I will use Rocky Linux 9.
To download, visit https://rockylinux.org/download/ and select `x86_64`'s `minimal` version.

## Step 2: Change the networking to bridged mode

Working with NAT'ted IP is a hassle for beginners. So, I prefer bridged mode.

On Virtualbox, do the following:

- Settings
- Network
- Attached to: Bridged Adapter
- Advanced - Regenerate the MAC address
  Now, start the VM and SSH into it.

## Step 3: Check the ip address assigned to VM

```
[root@localhost ~]# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 08:00:27:09:d9:51 brd ff:ff:ff:ff:ff:ff
    inet 10.13.164.84/21 brd 10.13.167.255 scope global dynamic noprefixroute enp0s3
       valid_lft 85778sec preferred_lft 85778sec
    inet6 fe80::a00:27ff:fe09:d951/64 scope link noprefixroute
       valid_lft forever preferred_lft forever
```

The ip address assigned to this VM on interface `enp0s3` is `10.13.164.84`. The subnet mask is `/21`.

#### The math behind IP addressing(subnetting)

I know the IP address of VM, which is `10.13.164.84`. Now, I want to find out network address, broadcast address and gateway for the configuration file at `/etc/sysconfig/network-scripts/ifcfg-enp0s3`.

```
Address:   10.13.164.84          00001010.00001101.10100 100.01010100
Netmask:   255.255.248.0 = 21    11111111.11111111.11111 000.00000000
Wildcard:  0.0.7.255             00000000.00000000.00000 111.11111111
=>
Network:   10.13.160.0/21        00001010.00001101.10100 000.00000000 (Class A)
Broadcast: 10.13.167.255         00001010.00001101.10100 111.11111111
HostMin:   10.13.160.1           00001010.00001101.10100 000.00000001
HostMax:   10.13.167.254         00001010.00001101.10100 111.11111110
Hosts/Net: 2046                  (Private Internet)
```

Everything shown above that's relevant to configuring static IP on linux will be mentioned below.

**First**
Convert IP address of VM and subnet mask to binary and perform AND operation. That'll get you network address. It's not used. In this case, it's `10.13.160.0`.

**Second**
Add `1` to the network address, it'll yield Gateway address. In this case, gatway address is `10.13.160.1`.

**Third**
To calculate broadcast address, I will first list the network address and subnet mask below.

```
00001010.00001101.10100 000.00000000
11111111.11111111.11111 000.00000000
```

Count upto `21` as it's the subnet mask.

```
00001010.00001101.10100 [000.00000000]
11111111.11111111.11111 [000.00000000]
```

Now convert all those `0s` to `1s`, it'll give the broadcast address. In this case, it's `10.13.167.255`.

Thus, the usable IP address for this VM ranges from `10.13.160.1` to `10.13.167.254`.

## Step 4: `/etc/sysconfig/network-scripts/ifcfg-enp0s3`

```
TYPE="Ethernet"
BOOTPROTO="none"
DEFROUTE="yes"
IPV4_FAILURE_FATAL="no"
NAME="enp0s3"
UUID="bb5e5b01-946d-493e-b595-1891bb0bab19"
DEVICE="enp0s3"
ONBOOT="yes"
ETHTOOL_OPTS="autoneg on"
IPADDR="10.13.160.2"
NETMASK="255.255.248.0"
GATEWAY="10.13.160.1"
DNS1="8.8.8.8"
DNS2="8.8.4.4"
```

This is the general format for that file. The details that I need to change here are `IPADDR`,`NETMASK` and `GATEWAY`. Currently, in my case, everything is correct, your IP may vary. Then reboot the VM for the changes to take place. Just, restarting `NetworkManager` won't work, because we're not using it to configure static IP.

References:
https://jodies.de/ipcalc?host=10.13.164.84&mask1=21&mask2=
https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/9/html/configuring_and_managing_networking/assembly_networkmanager-connection-profiles-in-keyfile-format_configuring-and-managing-networking
