---
title: "SDLC phases"
slug: "sdlc-phases"
added: "2026-03-28"
description: "SDLC phases in software engineering, important question for Loksewa Computer Engineering"
layout: ../layouts/BlogPost.astro
---

Software is developed in phases because we want to produce software at low cost and in reasonable time.

This phase based development of software is called as software development life cycle(SDLC).

Preliminary investigation->Software Analysis->Software Design->Software Coding->Software Testing->Software Maintenance

**Preliminary Investigation**

In this phase, feasibility study is carried out. It is done to check whether or not it is worth developing the software. This decision is based on three factors/constraints:

a) time

b) budget

c) technical

Time means the time required to complete the project. It is accounted for because more the time required, more will be the cost of development.

Budget required to complete the project is accounted for because a higher budget might mean the cost will not be recovered.

Technical abilities required to do the project are accounted for because hiring increases time and cost. So the organization has to find whether their existing team is capable or not.


**Software Requirement Analysis**

Here, the requirements of the software are carefully examined. After the analysis, a requirement statement known as software requirement specification(SRS) is developed.

**Software Design**

We design the software using:

- flowchart

- DFD(Data Flow Diagram)

- UML Diagrams(Use case, activity, sequence etc)

In software analysis, we asked "what to build?". In software design, we ask "How to build?"


**Software Coding**

It translates design to code. Software is built using:

- programming language

- libraries etc

Properties of good software are:

- maintainability

- readability

- documented

**Software Testing**

Software testing helps to ensure correct software is built.

Software testing can be classified into various types depending on various criteria.

- black box and white box testing

- unit and integration testing

You can explain about them further if the question is of 10 marks.

**Software Maintenance**

Software maintenance comes up after software is released. They provide application support, bug fixing, and performance improvement in this phase. 


Example of SDLC phases in library management system


Is it feasible to develop LMS? Does it save time of librarians and students? Does it reduce the cost of the university?


To understand the requirements, talk with the librarian, students, and teachers. Each of them can explain the requirements. eg:

librarian:
- need to issue books

- need to issue fines


students:

- need to rent books

- need to return books


Developer will design the software architecture using the aforementioned diagrams.


Developers will write code in Java, Spring Boot for example.

Testers will test if the system functionalities are working as expected.

Software will be released live. And if there are bugs, it will keep getting fixes.