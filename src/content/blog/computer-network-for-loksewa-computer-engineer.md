---
title: Computer Network Notes for Loksewa Computer Engineer
description: Complete guide to computer networks with most important questions
date: 2026-05-07
author: cst
image: /images/blog/network.png
---



## Pure ALOHA vs slotted ALOHA

| Pure ALOHA   |Slotted ALOHA |
| ------ | ----- |
| Users transmit whenever they want to transmit. | Users transmit only at the start of the next time slot.|
|Partial collision can occur.|Partial collision do not occur|


## HDLC vs PPP

|HDLC|PPP|
|----|---|
|HDLC is a bit-oriented protocol.|PPP is a byte-oriented protocol.|
|HDLC is Cisco proprietary protocol.| PPP is open standard protocol.|
|HDLC uses bit stuffing.|PPP uses byte stuffing.|

In HDLC, the start and end of frame is denoted by 0x7E. i.e. 01111110 in binary.

There is a chance that 0x7E might occur in payload data itself. So, whenever five consecutive ones are encountered, a '0' is automatically stuffed.

In PPP, DLE STX and DLE ETX are used as falgs to indicate the start and end of the frame.

If encountered DLE itself on the actual payload data, it is escaped with the help of 'DLE'. eg:

if we get payload=A,B,DLE,H,W

It will be escaped while framing as:

DLE,STX,A,B,DLE,DLE,H,W,DLE,ETX

**Transition phases of PPP connection**

Remember it as DENOT.


Dead->Establish->Network->Open->Terminate->Dead.

Dead means there is no connection to physical layer.

Establish means there is connection to physical layer.

Network means LCP(Link Control Packet) packets are exchanged between two points to negotiate over options.

Authentication means both sides check each other's identities. Authentication is optional in PPP.


Network means both sides send NCP(Network Control Protocol) packets to configure the network layer.

Open means data transport can take place.


## FDMA TDMA CDMA

|FDMA|TDMA|CDMA|
|----|----|----|
|In FDMA, all users are active over all the time.|In TDMA, all users are active over all the frequencies.|In CDMA, all users are active over all the time and all the frequencies.|
|Example of FDMA include AM and FM radio, broadcast TV|Examples of TDMA include Ethernet|Example of CDMA include data over the internet|

![FDMA TDMA CDMA](/public/images/blog/fdma_tdma_cdma_multiplexing.svg)

## Address Resolution Protocol
Address Resolution Protocol is a protocol used to find the MAC address of a device from its IP address. 

ARP operates at data link layer of the OSI model. 

This protocol is used within a LAN.


**Working of ARP**

A device on LAN wants to send a packet to another device. Although it knows the IP address of the destination device, it does not know the MAC address of that destination device. 

Hence sender sends an ARP request message. This is a boradcast message that means it is sent to all the devices on the LAN. ARP request consists of destination device's IP address.

Now, each devices will receive the ARP request. Each of them will compare their own IP address with the one in the ARP request packet. If the device finds a match, it will send an ARP response message to the requesting device. 

The ARP response consists of the device's own IP address.

The requesting device stores the IP->MAC address mapping in an ARP cache. ARP cache is a temporary storage for IP to MAC address mappings.

There are four types of ARP:

- Gratuitous ARP
- Reverse ARP
- Proxy ARP
- Inverse ARP

Gratuitous ARP is an unsolicited ARP response sent by a device to announce its IP and MAC address to the entire network.

Reverse ARP is obsolete protocol. Its function is same as DHCP(Dynamic Host Control Protocol). And reverse ARP has thus been replaced by DHCP.

Proxy ARP happens in a situation where one device sends the ARP response on behalf of other device. It happens when there is communication between two different subnets.

![proxy arp](/public/images/blog/proxy-arp.png)

As shown in the figure, the gateway will provide the ARP response on behalf of host B.

Inverse ARP is used in frame relay and ATM(Asynchronous Transfer Mode) to discover IP address associated with a specific virtual circuit.



## Routing algorithms

Routing algorithms can be classified as:
- Adaptive vs non-adaptive
- Centralized vs distributed
- Isolated vs non-isolated
- interior vs exterior

Adaptive routing algorithm adapts to changes in network traffic, network topology. Routing tables are constructed dynamically(not provided in advance). It is complex but more applicable in real world.

Centralized routing algorithm is a type of routing algorithm where a router server, a centralized server makes the routing decisions. The problem it faces is single point of failure.


## What is ICMP?

ICMP(Internt Control Message Protocol) is a mechanism for error reporting and host management queries. Error is reported to the original source of datagram not to the intermediate nodes.

## RIPv1 vs RIPv2

| RIPv1   |RIPv2 |
| ------ | ----- |
| Does not support authentication. | Supports authentication. |
|RIPv1 sends updates as a broadcast.|RIPv2 sends updates as multicast.|
|RIPv1 only supports classful routing.| RIPv2 supports classless routing.|

## BGP

BGP stands for Border Gateway Protocol.

BGP is placed between autonomous systems.

> Autonomous systems means networks that are under same authority.

> AS are registered using Autonomous System Number(ASN).

BGP can be called internet delivery service. When someone sends data over the internet, BGP checks all the available paths that the data can travel and chooses the best route.

**BGP message types**

BGP uses 4 message types
- OPEN
- UPDATE
- NOTIFICATION
- KEEPALIVE

BGP messages are transported over TCP.

**OPEN**:

When a router wants to create a neighborhood relation with another router, it ssends the OPEN packet.

**UPDATE**:

UPDATE packet is used to announce, update, and cancel routes.

**NOTIFICATION**:

NOTIFICATION packet is used to indicate the error status to the BGP neigbor.


**KEEPALIVE**:

KEEPALIVE packet is used to indicate the serviceability of BGP neighbors. It checks if the BGP neighbor is alive or not.

## Converged Network

Converged network is a single network infrastructure which transports voice, video, data and other different types of traffic.

Single network infrastructure implies cost savings. 

Converged network is thus a collection of wired mediums+wireless mediums+IoT technology.

**Benefits of converged network**:

- Complexity of the network infrastructure is reduced because of fewer protocols and fewer operating systems.

- Carrier circuit charges are reduced.

- Circuit redundancy is eliminated.

- Consistent user interfaces are possible.

- Organizations save costs-->low staffing required.

## RIP vs OSPF

| RIP   |OSPF |
| ------ | ----- |
| RIP is a distance vector routing protocol. |OSPF is a link state routing protocol. |
|RIP is primitve.| OSPF is intelligent.|
|RIP uses only hop count as a routing metric.|OSPF uses security, distance, delay and many other parameters as a routing metric.|
|RIP uses Bellman Ford algorithm.| OPSF uses Dijkstra's shortest path algorithm.|

