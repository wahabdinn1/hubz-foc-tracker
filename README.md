# Hubz FOC Tracker

Hubz FOC Tracker is an enterprise-grade analytics dashboard and logistics tracking portal. It is designed to deeply manage the hardware lifecycle by aggregating device check-ins, check-outs, and tracking data stored in Google Sheets. 

With an intuitive, unified interface built on a Premium SaaS aesthetic, Hubz FOC accelerates the workflow for managing Free-of-Charge (FOC) device loans, specifically targeted at managing Key Opinion Leaders (KOL).

## ✨ Features

- **Dashboard Analytics**: High-level glassmorphic Aceternity UI scorecards offering instant metrics on Available stock, Outstanding Loans (KOL), Unreturns, and Pending Urgent inbound devices.
- **Inventory Bank**: An advanced "All-in-One" hub to manage raw items. View specific model counts, or use the supercharged Master List to dive into thousands of items.
- **KOL Directory**: A fully integrated tracker that dynamically aggregates Google Sheets data to show precisely which KOL holds which devices across the board.
- **Form Modals**: Intuitive Outbound (Loan out) and Inbound (Return) forms with deep form-validation (Zod), intelligent auto-filling, and specific data formats (e.g., suffixed domain emails).
- **Security Checkpoints**: Built on Edge Middleware, ensuring no heavy operations load without a cryptographic validation of the user's PIN using JSON Web Tokens.
- **Full Theming Support**: Complete deep Light & Dark mode support built with `next-themes` and strict Tailwind CSS `dark:` utilities.

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Directory, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) + [Aceternity UI](https://ui.aceternity.com/) (Framer Motion)
- **State & Theme**: `next-themes`, React Hooks
- **Icons**: [Lucide React](https://lucide.dev/) & [Tabler Icons](https://tabler.io/icons)
- **Validation**: [Zod](https://zod.dev/) & `react-hook-form`
- **Database/Storage**: Google Sheets API (Server Actions)
- **Auth**: `jose` (Edge-compatible JWT processing)

## 🚀 Getting Started

### 1. Environment Configuration

Create a `.env.local` file at the root of the project. You must supply your Google Service Account credentials alongside the target Google Sheet ID.

```env
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_SHEET_ID="your_google_sheet_id_here"
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application. You will be prompted with a secure PIN entry screen before gaining access to the main Hubz Dashboard.

For technical documentation on modifying or extending the architecture, please see [DEVELOPING.md](./DEVELOPING.md).
