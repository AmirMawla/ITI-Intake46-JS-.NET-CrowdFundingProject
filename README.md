# CrowdFundProject

Full-stack crowdfunding platform:
- **Backend**: ASP.NET Core Web API (.NET) with EF Core + Identity (JWT auth, roles, admin endpoints).
- **Frontend**: Vanilla HTML/CSS/JS (no framework) served as static files.

---

## Project structure

- `CroudFund-Back/`
  - `CroudFund-PL/` – Web API (controllers, startup, endpoints)
  - `CroudFund-BLL/` – business logic, repositories, DTOs, validation, errors
  - `CroudFund-DAL/` – EF Core models, migrations, DbContext, seed data
- `CroudFund-Front/CroudFound/`
  - `index.html` + `pages/*.html` – UI pages (user + admin)
  - `css/` – styles (`styles.css`, `admin-pages.css`)
  - `js/` – API layer + page scripts

---

## Main features

### Backend
- JWT authentication + refresh tokens
- Roles: **Admin** / **User**
- Campaigns: create/update/delete, approval workflow for admin
- Pledges + payments (Stripe test flow + analytics endpoints)
- Reviews (messages) + categories management
- Pagination + filtering + sorting on many admin endpoints
- Seed data (users, categories, campaigns, pledges, payments, reviews)

### Frontend
- Responsive layout (desktop/tablet/mobile)
- Admin area:
  - Control Center dashboard
  - All Users / All Campaigns / All Pledges / Messages / Categories pages
  - Consistent modal dialogs for destructive actions
- User area:
  - Explore + campaigns list + campaign details
  - Creator dashboard + my campaigns + donations + messages + settings

---

## Prerequisites

- **.NET SDK** (recommended: latest installed on your machine)
- **SQL Server** (LocalDB or SQL Server instance used by your connection string)
- **JWT** (Add Secret Key For Jwt In secret Keys 


---

## Configuration

### Database + seed data

The backend includes seed data in:
If you drop and recreate the database, seed data will be inserted (roles, users, campaigns, pledges, payments, reviews).

### Stripe (test)

This project uses Stripe in **test mode**.
- The test payment-method endpoint expects a Stripe test token such as `tok_visa`.

---

## How to run (Windows)

### 1) Run the backend API

Open PowerShell:

```powershell
cd "d:\amir\data\programing\my projects\CroudFundProject\CroudFund-Back\CroudFund-PL"
dotnet restore
dotnet run
```

The API base URL used by the frontend is configured in:
- `CroudFund-Front/CroudFound/js/config.js` 

### 2) Run the frontend (static)

Serve `CroudFund-Front/CroudFound/` using any static server.

Options:

- **VS Code**: install “Live Server”, then “Open with Live Server” on `index.html`
- **Any static server**: point it to `CroudFund-Front/CroudFound/`

Then open:
- `index.html`

---

## Default seed accounts

Seeded admin user is created in `SeedData.cs`.
---

## Notes

- The frontend is intentionally framework-free (plain JS) and communicates with the backend through `js/api.js`.
- If you change backend ports/URLs, update `API_CONFIG.BASE_URL` in `CroudFund-Front/CroudFound/js/config.js`.

