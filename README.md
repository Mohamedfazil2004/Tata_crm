# Tata Motors CRM — Advertisement Lead Management

A professional, enterprise-grade CRM built for managing Meta (Facebook/Instagram) advertisement leads and distributing them to 14 Tata Motors dealerships.

## 🚀 Quick Start

### 1. Database Configuration
Ensure you have MySQL installed and running. Update the connection details in `backend/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tatamotors_crm
```

### 2. Automatic Setup
Run the setup script to create the database and seed initial users/dealers:
```bash
setup_database.bat
```

### 3. Start the Application
You need two terminals:

**Terminal 1 (Backend - Port 5000):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend - Port 3000):**
```bash
cd frontend
npm run dev
```

---

## 🔑 Login Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@2026` |
| **Campaign Team** | `swetha` | `Swetha@2026` |
| **Dealers** | `xps_motors` | `Dealer@2026` |
| | `urd_motors` | `Dealer@2026` |

*Note: There are 14 dealer accounts in total (vst_trichy, svca_motors, etc.).*

---

## ✨ Key Features

- **Automated Lead Routing:** Leads are automatically assigned to one of 14 dealers based on the district field (`உங்கள்_மாவட்டம்`).
- **Data Sanitization:** Automatic removal of 12 unnecessary Meta columns during upload.
- **Date Adjustment Logic:** Ensures leads are always dated to the day before upload for consistency.
- **Analytics Dashboards:**
  - **Admin:** System-wide conversion rates and dealer performance charts.
  - **Campaign:** Daily ad spend tracking and cost-per-lead (CPL) analysis.
  - **Dealer:** Daily follow-up tasks and lead status management.
- **Tamil Language Support:** Maps Tamil Excel headers to English database fields automatically.

---

## 🛠 Technology Stack

- **Frontend:** React.js + Vite + Recharts (Analytics)
- **Backend:** Node.js + Express.js + JWT (Auth)
- **Database:** MySQL
- **Styling:** Custom Tata Brand Design System (Vanilla CSS)
