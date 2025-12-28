---
title: "How dns works"
slug: "dns"
added: "2025-12-28"
description: "The lifecycle of a DNS query, big picture of dns working principle"
layout: ../layouts/BlogPost.astro
---

DNS is used for mapping domain names to IP addresses.

Steps:

- User wants to browse www.nsrc.org in an application of their choice(a web browser for example but could be a command line utility as well).

- The browser needs IP address in order to fetch the page. So the browser asks "What is the IP Address of www.nsrc.org?" to the operating system it resides in which in turn asks the local dns resolver.

- Assume the required name to ip mapping is not present in the local dns resolver. Local dns resolver will now ask the aforementioned query to the pre-configured recursive dns server (for example: 1.1.1.1, 8.8.8.8 etc).

- The recursive DNS server is called "recursive" because it might cache name to ip mapping for a limited amount of time but it does not store name to ip mapping authoritatively. Its job is to ask the authoritative dns servers, get the response and provide that to the local dns resolver.
Recursive DNS server ask the root's dns server "What is the IP Address of www.nsrc.org?".

- Since DNS is based on hierarchical model, a particular node at a hierarchy only knows information about the node just below it. Root dns server provides the ip address of org dns server to recursive dns server.

- Recursive dns server now asks the org dns server "What is the IP Address of www.nsrc.org?". The org dns server only knows about the ip address of dns server of www.nsrc.org. So the org dns server responds with that ip address to recursive dns server.

- Recursive dns server now asks the nsrc.org dns server "What is the IP Address of www.nsrc.org?". The nsrc.org dns server is maintained by the team of www.nsrc.org. It indeed contains the ip address of www.nsrc.org. Hence it responds back with the ip address of www.nsrc.org to the recursive dns server.

- The recursive dns server finally has got the answer. It can choose to cache the response for a particular amount of time. Nevertheless, it will respond with the desired ip address to the local dns resolver. Local dns resolver in turn responds to application. 

This completes the flow.

The figure of all the above mentioned steps is provided ![here](https://i.imgur.com/w3sh1XA.jpeg)