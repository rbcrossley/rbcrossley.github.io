---
title: "Address Resolution Protocol"
slug: "address-resolution-protocol"
added: "2026-03-27"
description: "Address Resolution Protocol Important Notes for PSC Computer Engineering IT Officer roles"
layout: ../layouts/BlogPost.astro
---

Address Resolution Protocol is a protocol used to find MAC address from IP Address.

ARP operates at data link layer of the OSI model.

This protocol is used within a LAN.

How does an ARP work?

A device on a LAN wants to send a packet to another device. It know the IP address of the destination device but not its MAC address. Hence, sender initiates an ARP request.

ARP request is a broadcast message. That means it is sent to every hosts in the LAN. ARP request message contains destination device IP address.

When each device in the LAN receive the ARP request, they compare the destination IP with their own. If matched, that device sends ARP response message to the requesting device.

ARP response consists of its own MAC address.

The requesting device stores the received MAC address in its ARP cache.

The requesting device now onwards can send the packet directly to the target device using its MAC address over the Ehternet(LAN).

There are four types of ARP.

00) Gratuitous ARP

It is unsolicited ARP response sent by a device.

It is used to announce its IP->MAC mapping across the entire network.

01) Reverse ARP

It is obsolete protocol. It is replaced by DHCP(Dynamic Host Configuration Protocol). It does MAC to IP translation.

02) Proxy ARP

When some device except the target device responds to the ARP request on behalf of the target device, this is called proxy ARP.

This happens usually on a different subnet.

Example. There is Network-A and Network-B. Both are connected by a gateway router. This situation occurs when host A on Network-A wants to send packet to host B as the destination. The gateway connecting two networks will respond to the ARP request of host A on behalf of host B. Host A will think it is communicating with Host B but there is proxy device instead. 


03) Inverse ARP

It is used in frame relay and ATM. It is used to discover IP address associated with a specific virtual circuit. Even I do not have enough idea about what it does. If you have, please ping me.





