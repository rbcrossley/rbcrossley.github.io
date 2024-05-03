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
```

The ip address assigned to this VM on interface `enp0s3` is `192.168.1.65`. The subnet mask is `/24`. Note that interface name could be `ifcfg-ens33` in centos linux. And different for every kinds of linux distribution. The best way to find it out is to type out the above command and check yourself.
#### The math behind IP addressing(subnetting)
I know the IP address of VM, which is `192.168.1.65`. Now, I want to find out network address, broadcast address and gateway for the configuration file at `/etc/sysconfig/network-scripts/ifcfg-enp0s3`.
```
Address:   192.168.1.65          11000000.10101000.00000001 .01000001
Netmask:   255.255.255.0 = 24    11111111.11111111.11111111 .00000000
Wildcard:  0.0.0.255             00000000.00000000.00000000 .11111111
=>
Network:   192.168.1.0/24        11000000.10101000.00000001 .00000000 (Class C)
Broadcast: 192.168.1.255         11000000.10101000.00000001 .11111111
HostMin:   192.168.1.1           11000000.10101000.00000001 .00000001
HostMax:   192.168.1.254         11000000.10101000.00000001 .11111110
Hosts/Net: 254                   (Private Internet)
```
Everything shown above that's relevant to configuring static IP on linux will be mentioned below.

**Network Address**
Convert IP address of VM and subnet mask to binary and perform Logical AND operation. That'll get you network address. It's not used because it's the first IP address in a subnet. In this case, it's `192.168.1.0`. [Read more](https://superuser.com/questions/379451/why-can-a-network-address-not-be-a-valid-host-address) about it.

**Gateway Address**
The concept of gateway address is somewhat confusing.
Add `1` to the network address, it'll yield Gateway address. In this case, gateway address is `192.168.1.1`. Or follow the general convention that the last usable address of subnet is the address of the gateway i.e `broadcast address-1` is the gateway address. But if you want the VM to connect with the other VMs and internet, you need to choose the IP of gateway same as that of the router. To find the IP address of your router in windows 10, `ipconfig /all` and check `Default Gateway`.

**Broadcast Address**
To calculate broadcast address, I will first list the network address and subnet mask below.

```
11000000.10101000.00000001 .00000000(this is network address)
11111111.11111111.11111111 .00000000(this is subnet mask)
```

Count up to `24` as it's the subnet mask. The bits in concern are thus the last octet of the network address. i.e `00000000`. Your job is to convert all zeroes present here to ones.

```
11000000.10101000.00000001 .[00000000]
11000000.10101000.00000001 .[11111111]
```

Now convert all those `0s` of subnet mask to `1s`, it'll give the broadcast address. In this case, it's `192.168.1.255`. Thus, the usable IP address for this VM ranges from `192.168.1.1` to `192.168.1.254`. The first and last addresses are not used for hosts.
## Step 4: `/etc/sysconfig/network-scripts/ifcfg-enp0s3`

```
TYPE="Ethernet"
BOOTPROTO="none"
DEFROUTE="yes"
IPV4_FAILURE_FATAL="no"
NAME="enp0s3"
UUID="bb5e5c01-946d-493e-b595-1891bb0bab19"
DEVICE="enp0s3"
ONBOOT="yes"
ETHTOOL_OPTS="autoneg on"
IPADDR="192.168.1.2"
NETMASK="255.255.255.0"
GATEWAY="192.168.1.1"
DNS1="8.8.8.8"
DNS2="8.8.4.4"
```
This is the general format for that file. The details that I need to change here are `IPADDR`,`NETMASK` and `GATEWAY`. Currently, in my case, everything is correct, your IP may vary. Then reboot the VM for the changes to take place. Just, restarting `NetworkManager` won't work, because we're not using it to configure static IP.

References:
https://jodies.de/ipcalc?host=192.168.1.65&mask1=24&mask2=

https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/9/html/configuring_and_managing_networking/assembly_networkmanager-connection-profiles-in-keyfile-format_configuring-and-managing-networking
