# Xeno CRM Platform - Frontend

<div align="center">

![Project](https://img.shields.io/badge/✨_Xeno_CRM-Frontend-8b5cf6?style=for-the-badge&labelColor=6366f1)

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Deployed_App-4285f4?style=for-the-badge)](https://xeno-crm-frontend-two.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/your-username/your-repo-name)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Hosted-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

**An intuitive and responsive user interface for customer segmentation, campaign creation, and AI-powered analytics, built for the Xeno SDE Internship Assignment.**

[✨ Features](#-features) • [🚀 Getting Started](#-local-setup-instructions) • [🛠️ Tech Stack](#️-tech-stack) • [🧠 AI & Tech Summary](#-summary-of-ai-tools-and-tech-used) • [⚠️ Limitations](#️-known-limtations--assumptions)

</div>

---

This repository contains the frontend application for the Mini CRM Platform, built with **Next.js**, **React**, and **TypeScript**. It provides a clean, modern user interface for interacting with the CRM backend, enabling users to create audience segments, view campaign history, and gain actionable insights from an AI-powered analytics dashboard.

The UI is styled with **Tailwind CSS** for a responsive, utility-first design and uses **Recharts** for rich data visualizations.

---

## ✨ Features

* **Secure Authentication**:
    * Seamless **Google OAuth 2.0** login using a popup window for a better user experience, with an automatic redirect fallback if popups are blocked.
    * Robust client-side session management using a flexible token handling strategy (`localStorage` for production, cookies for development).
    * Protected routes ensure only authenticated users can access the dashboard and campaign tools.
* **AI-Powered Insights Dashboard**:
    * A dynamic dashboard that visualizes key business metrics and AI-driven predictions from the backend.
    * Features rich charts (using **Recharts**) for revenue forecasts, customer risk analysis, and engagement factors.
    * Continuously polls the backend for fresh data, with a subtle UI indicator to show when new insights have been loaded.
* **Dynamic Campaign & Audience Builder**:
    * An intuitive interface for defining customer segments using flexible, nested rule logic (`AND`/`OR`).
    * Allows users to preview the size of their target audience in real-time before launching a campaign.
    * Integrates an AI feature to convert **natural language prompts** (e.g., "users who spent over 5k") into logical segmentation rules.
* **Campaign History & Analytics**:
    * A comprehensive view of all past campaigns, with the most recent displayed at the top.
    * Clear delivery statistics for each campaign, including audience size, sent, and failed messages.
* **Robust & Resilient API Communication**:
    * **Request Deduplication**: A custom `useApi` hook prevents identical `GET` requests from being fired simultaneously from different components, saving network bandwidth.
    * **Automatic Retries**: The API client automatically retries failed `GET` requests on rate-limit errors (HTTP 429) with an exponential backoff strategy.
    * **Defensive Normalization**: Utility functions normalize inconsistent API responses (e.g., for paginated data) into a predictable shape for the UI.

---

## 🛠️ Tech Stack

* **Framework**: Next.js (with App Router)
* **Library**: React.js
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **UI Components**: shadcn/ui, Heroicons
* **Data Visualization**: Recharts
* **API Communication**: Axios
* **Utilities**: `js-cookie`, `date-fns`

---

## 🏗️ Architecture Diagram

*(This section is reserved for the architecture diagram. I will add it here later.)*

<br/>
<br/>

---

## 🚀 Local Setup Instructions

Follow these steps to get the frontend application running on your local machine.

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher)
* [NPM](https://www.npmjs.com/) (or Yarn/PNPM)

### 1. Clone the Repository

```bash
git clone https://github.com/pra9711/xeno-crm-frontend
cd xeno-crm-frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a .env.local file in the root of the project.
Now, fill in the .env.local file. At a minimum, you must specify the backend API URL.

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
NEXT_PUBLIC_APP_NAME=Xeno CRM
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_BACKEND_DEV_TOKEN_FALLBACK=false
NEXT_PUBLIC_VENDOR_API_URL=http://localhost:3001/api/vendor
NEXT_PUBLIC_VENDOR_API_KEY=dummy-vendor-api-key
NEXT_PUBLIC_USE_MOCKS=true

```

### 4. Run the Development Server

```bash
npm run dev
```

The application should now be running at http://localhost:3000.

## 🧠 Summary of AI Tools and Tech Used
This project leverages modern frontend technologies to deliver a feature-rich and interactive user experience.

* **AI Insights Visualization**: The frontend's primary AI role is to effectively **consume and visualize** complex data generated by the backend. The `ai-insights` page (`app/dashboard/ai-insights/page.tsx`) uses the **Recharts** library to render predictive analytics, such as:
    * An `AreaChart` to display multi-month revenue forecasts.
    * A `RadarChart` to analyze the factors contributing to a customer's health score (e.g., engagement vs. spending).
* **Resilient & Optimized Data Fetching**: The custom `useApi` hook is the cornerstone of the application's interaction with the backend. It is designed for scalability and resilience by:
    * **Deduplicating** concurrent `GET` requests to the same endpoint, which is critical in complex UIs where multiple components might request the same data.
    * Implementing **automatic retries with exponential backoff** for rate-limited requests, making the application more robust against transient network or server issues.
* **Authentication Strategy**: The application implements a flexible authentication token handling mechanism within `src/lib/auth.ts`. It stores the JWT in **cookies during development** (for same-site contexts) and switches to **`localStorage` in production**. This approach is designed to support different deployment architectures, such as a cross-domain setup where `httpOnly` cookies may not be feasible.
* **Defensive API Normalization**: To protect the UI from potential inconsistencies in backend responses, helper functions like `normalizeListAndPagination` are used. This ensures that data passed to components always has a predictable structure, reducing the likelihood of runtime errors.

---

## ⚠️ Known Limitations & Assumptions
* **Development Mocks**: The AI Insights dashboard includes a development-only mock data mode, which can be enabled via the `NEXT_PUBLIC_USE_MOCKS` environment variable. This allows for isolated frontend development but does not reflect live data from the backend.
* **Synchronous State Updates**: The application uses standard "fire-and-forget" API calls for mutations. For long-running operations initiated by the user (like launching a large campaign), the UI provides immediate feedback but does not currently use WebSockets or server-sent events to track the background task's progress in real-time.
* **Token Storage in `localStorage`**: The production strategy of storing the JWT in `localStorage` makes it accessible to client-side JavaScript. This is a deliberate trade-off for compatibility in cross-domain deployment scenarios. It assumes that the risk of XSS is mitigated and that tokens have a reasonably short expiration time.
* **Minimal Client-Side Caching**: The application fetches fresh data from the server on most page loads to ensure timeliness. It does not implement an advanced client-side caching strategy (like React Query or SWR), which could further optimize performance in a larger-scale application.
