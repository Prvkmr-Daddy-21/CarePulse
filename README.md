# 🏥 MediConnect - Healthcare Management System

MediConnect is a full-stack healthcare management platform designed to streamline patient registration, appointment scheduling, doctor management, and hospital administration through a modern web interface.

## 🚀 Features

### 👨‍⚕️ Patient Management
- Patient registration system
- Secure patient profile creation
- Medical history management
- Allergy and health record tracking
- Document upload support

### 📅 Appointment Management
- Online appointment booking
- Real-time slot availability
- Appointment status tracking
- Appointment history
- Booking validation system

### 👨‍⚕️ Doctor Management
- Admin doctor onboarding
- Doctor profile management
- Specialty management
- Doctor availability tracking
- Active/Inactive doctor status

### 🔐 Authentication & Security
- Secure login system
- Role-based access control
- Protected routes
- Session management

### 📊 Admin Dashboard
- Patient analytics
- Appointment monitoring
- Doctor management
- System overview statistics

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Lucide React Icons

### Backend
- Node.js
- Express.js
- TypeScript

### Database
- MongoDB Atlas
- Mongoose

## 📂 Project Structure

```bash
MediConnect/
├── src/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   └── pages/
├── server/
│   ├── routes/
│   ├── models/
│   ├── services/
│   └── middleware/
└── README.md
```

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/MediConnect.git
cd MediConnect
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3000
JWT_SECRET=your_secret_key
```

### Start Development Server

```bash
npm run dev
```

Application will run at:

```bash
http://localhost:3000
```

## 👨‍💻 Author

Praveen Kumar

## 📄 License

This project is licensed under the MIT License.
