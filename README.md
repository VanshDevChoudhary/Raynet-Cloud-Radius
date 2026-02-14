# Raynet Cloud RADIUS

Cloud-hosted RADIUS + billing platform for ISP operators. ISPs sign up, connect their MikroTik routers, manage subscribers, handle billing — all from one dashboard.

Built this to replace legacy ISP management tools (like XceedNet) that require on-premise servers and manual setup.

## What it does

- **Multi-tenant SaaS** — each ISP gets their own isolated workspace
- **RADIUS authentication** — FreeRADIUS backed by PostgreSQL, handles PPPoE/hotspot auth
- **Subscriber management** — CRUD, plan assignment, MAC binding, static IP, grace periods
- **Billing & invoices** — auto-generate invoices, track payments, Razorpay integration
- **MikroTik integration** — rate limiting via Mikrotik-Rate-Limit attributes, CoA disconnect
- **Hotspot portal** — branded captive portal with OTP login
- **Voucher system** — prepaid voucher batches with QR codes
- **Reports** — revenue, usage, sessions, churn, collections
- **Background jobs** — billing cron, notifications (SMS/email/WhatsApp) via BullMQ

## Tech stack

- Next.js 15 (App Router) — full-stack, no separate backend
- PostgreSQL + Prisma ORM
- FreeRADIUS with `rlm_sql_postgresql`
- Redis + BullMQ for job queues
- NextAuth v5 for authentication
- shadcn/ui + Tailwind CSS
- Recharts for dashboard charts

## Getting started

```bash
# clone and install
git clone https://github.com/VanshDevChoudhary/Raynet-Cloud-Radius.git
cd Raynet-Cloud-Radius
pnpm install

# set up env
cp .env.example .env
# edit .env with your database URL, redis URL, etc.

# database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# run
pnpm dev
```

You also need FreeRADIUS configured to read from the same PostgreSQL database. Config files are in `radius/` and `deploy/freeradius/`.

## Project structure

```
src/
  app/           # Next.js pages and API routes
    (admin)/     # ISP operator dashboard
    (portal)/    # Subscriber self-service portal
    (auth)/      # Login, register, forgot password
    (super-admin)/ # Platform admin panel
    api/         # REST endpoints
    hotspot/     # Captive portal
  services/      # Business logic layer
  lib/           # Utilities, auth, RADIUS client, validations
  components/    # Shared UI components
  jobs/          # BullMQ workers (billing, notifications)
prisma/          # Schema and migrations
deploy/          # Nginx, Docker, PM2 configs
radius/          # FreeRADIUS configuration
```

## Deployment

Currently deployed on Oracle Cloud (ARM). See `deploy/` for:
- `docker-compose.prod.yml` — PostgreSQL + Redis containers
- `ecosystem.config.cjs` — PM2 process config
- `deploy/nginx/cloudradius` — Nginx reverse proxy config
- `.github/workflows/deploy.yml` — GitHub Actions auto-deploy

## Known issues

- PDF invoice generation has some JSX type quirks in the route handler
- Forgot password flow is stubbed out (needs email template)
- Session CSV export not implemented yet

## Roadmap

- [ ] WhatsApp Business API integration (currently using basic HTTP)
- [ ] Franchise/reseller billing split
- [ ] Mobile app (React Native)
- [ ] MikroTik API direct integration (beyond RADIUS)
- [ ] Usage-based billing (per-GB metering from radacct)
