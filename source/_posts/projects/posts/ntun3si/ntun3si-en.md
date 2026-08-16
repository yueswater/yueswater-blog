---
title: NTU National Security & Strategy Studies Club Website
date: '2026-05-15'
lang: en
categories: &id001
- React
- Node.js
- MongoDB
- Full-Stack
tags: *id001
excerpt: A full-stack club management platform built for NTU National Security Society,
  covering event registration, officer management, and article publishing.
---

[<img src="https://img.shields.io/badge/website-ntun3si.space-f2f2f2?style=flat-square&labelColor=181818" alt="">](https://ntun3si.space) [<img src="https://img.shields.io/badge/commits-116-f2f2f2?style=flat-square&labelColor=181818" alt="">](https://github.com/yueswater/ntun3si)

## About This Project

Founded in 2023, the [NTU National Security Society](https://ntun3si.space/) (NTUN3SI) had been running its operations in a fairly scattered way — Google Forms for event sign-ups, Line groups for announcements, and Excel sheets for tracking attendance. Invited by the current president, I built this platform from scratch to bring everything under one roof.

The tech stack was straightforward: React + Vite + Tailwind CSS on the front end, Express.js on the back end, and MongoDB as the database. The main goal was to get a few core workflows right — event registration, member list management, and letting members check their own records.

## Features

### Event Registration

When creating an event, the organizer can configure the following:

| Field | Description |
| :--- | :--- |
| Name, time, location | Basic event info |
| Registration deadline | Automatically closes the sign-up form when expired |
| Capacity limit | Moves registrants to the waitlist once full |
| Custom form fields | Each event can collect different data from registrants |

- After submission, officers review each registration and mark it as **accepted**, **waitlisted**, or **rejected** — members are notified when their status changes
- If a member needs to modify a submitted registration, they must go through a `ChangeRequest` flow; the change only takes effect after officer approval, keeping the original data intact during review
- On-site check-in uses QR codes — each registrant gets a unique code, and scanning it instantly updates their attendance status without any manual list-checking

### Accounts and Login

- **Local credentials**: Passwords are hashed with bcryptjs and never stored in plain text
- **Third-party OAuth**: Google login handled through Passport.js

After logging in, users receive a JWT and the front end uses the token to maintain the session. Each account has a personal page showing:

- All registration records and their current review status
- Past attendance history

### Content Management

**Articles**

Officers can write and publish articles in the back end. Content is written in Markdown and rendered on the front end via `marked`. Two states are available:

- `draft`: only visible in the back end
- `published`: appears in the announcements section on the home page

**Officer Page**

Each officer's profile — name, title, term, and photo — is managed in the back end and pulled directly to the officer introduction page on the front end. Photos are uploaded to AWS S3, with automatic HEIC conversion so images taken directly from an iPhone work without any extra steps.

## Screenshots

<figure><img src="home.png" alt="Home page" width="75%"><figcaption>Home page</figcaption></figure>

The site uses a dark color scheme throughout. The top section introduces the society with a short tagline, and scrolling down reveals upcoming events, recent articles, and a brief club introduction. The navigation bar stays fixed at the top, so users do not need to scroll back up to switch pages.

<figure><img src="events.png" alt="Events page" width="75%"><figcaption>Events page</figcaption></figure>

Events are displayed as cards, each showing the event name, date, location, and registration deadline. Status labels — open, full, closed — are visible without clicking into the event. The full description and registration form are available on the event detail page. Any updates made in the back end are reflected on the front end right away.

<figure><img src="articles.png" alt="Articles page" width="75%"><figcaption>Articles page</figcaption></figure>

All published articles and announcements are listed here in reverse chronological order, with a title, short preview, and date shown for each entry. Article content supports Markdown rendering, including headings, bold text, blockquotes, and code blocks — suitable for event write-ups, short policy commentary, or internal notices.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Front end | React 18, Vite, Tailwind CSS |
| Back end | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Auth | Passport.js (Google OAuth), JWT, bcryptjs |
| File storage | AWS S3 (Multer) |
| Email | Nodemailer |
| Scheduling | node-cron |
| Validation | Zod |
| Deployment | Docker, Render |
