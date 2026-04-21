# 🔧 DeviceHub - QA Device Management System

A full-stack web application for managing shared QA test devices (mobile phones, tablets) within an organization. Built with React, Node.js, Express, and MySQL.

![DeviceHub](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Overview

DeviceHub helps QA teams efficiently manage their pool of shared test devices through:
- **Device checkout/return workflow** with admin approval
- **Future reservations** with automatic activation
- **Waitlist system** with email notifications
- **Device health tracking** to prevent checkout of faulty devices
- **Usage analytics** to identify underutilized or high-demand devices
- **Real-time email notifications** for all workflow actions

## ✨ Key Features

### For QA Team Members
- 📱 Browse available devices with filters
- ✅ Request device checkout
- 📅 Reserve devices for future dates
- ⏳ Join waitlist for unavailable devices
- 🚨 Report device issues
- 📊 Track personal activity

### For Administrators
- ✅ Approve/Reject checkout and return requests
- 🔧 Full device CRUD operations
- 🔄 Force return devices
- 📈 Usage analytics dashboard
- 📧 Automatic email notifications

## 🛠️ Tech Stack

**Frontend:** React 18 • Vite • Tailwind CSS • Recharts  
**Backend:** Node.js • Express • MySQL • JWT  
**Features:** Email notifications • Background jobs • Audit logging

## 📦 Quick Start

### Prerequisites
- Node.js v16+
- MySQL 5.7+
- SMTP server

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/devicehub.git
cd devicehub

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials

# Run migrations in MySQL
# migrations/001_initial_schema.sql
# migrations/002_seed_data.sql (optional)

npm run dev

# Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

## 🎨 Customization

Easily customize branding in `frontend/tailwind.config.js`:
```javascript
colors: {
  primary: '#2563eb',      // Your brand color
  secondary: '#3b82f6',
  accent: '#10b981',
}
```

## 📊 Features Showcase

- **Smart Checkout System** - Prevents conflicts and tracks expected return dates
- **Automated Reservations** - Background job activates reservations on start date
- **Waitlist with Notifications** - Auto-notify users when devices become available
- **Health Tracking** - Block checkouts for devices with critical issues
- **Analytics Dashboard** - Identify most requested devices, idle devices, top users
- **Audit Trail** - Complete activity logging for compliance

## 📧 Email System

Automated emails for:
- Checkout approved/rejected
- Return confirmed
- Waitlist notifications
- Reservation approvals

## 🔐 Security

- Bcrypt password hashing
- JWT authentication
- Parameterized SQL queries
- Input validation with Zod

## 📝 License

MIT License - feel free to use for your organization!

## 👤 Author

**Your Name**  
GitHub: [Nirmal1913](https://github.com/Nirmal1913)  
LinkedIn: [(www.linkedin.com/in/akhila-nirmal-b480b8253)]

## 📸 Screenshots
<img width="1268" height="753" alt="image" src="https://github.com/user-attachments/assets/73a9c661-5fe3-487a-a676-447d82964401" />
<img width="1322" height="720" alt="image" src="https://github.com/user-attachments/assets/f38aba5b-75d4-4eeb-8ab0-77ab6fde8fcd" />
<img width="1353" height="615" alt="image" src="https://github.com/user-attachments/assets/40009792-c623-4a2d-a85f-8bfde42a19f6" />
---

⭐ Star this repo if you find it useful!
