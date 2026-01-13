# 💊 Pharmacy Inventory System

A full-stack web application designed to manage drug stocks, track user activities, and generate professional audit reports. This system features role-based access control for **Admins** and **Cashiers**.

## 🌟 Key Features

* **Inventory Management**: Add, update, and view real-time drug stock levels.
* **Role-Based Access**:
* **Admin**: Full control over inventory and system logs.
* **Cashier**: Access to process sales and view stock.


* **Audit Trail**: Automated tracking of all system actions (sales, additions, user creation).
* **PDF Report Generation**: Downloadable professional audit reports using `jsPDF`.
* **Secure Authentication**: JWT-based login system.

---

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React.js, Axios, CSS3 |
| **PDF Engine** | jsPDF, jsPDF-AutoTable |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL (or your specific DB) |

---

## 🚀 Installation & Setup

### 1. Prerequisites

Ensure you have **Node.js** and **npm** installed on your machine.

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/pharmacy-inventory-system.git
cd pharmacy-inventory-system

```

### 3. Backend Setup

Navigate to your server folder and install dependencies:

```bash
cd backend
npm install
npm start

```

*Make sure your backend is running on `http://localhost:5000`.*

### 4. Frontend Setup

Navigate to your frontend folder and install dependencies:

```bash
cd frontend
npm install jspdf jspdf-autotable axios
npm start

```

---

## 📂 Project Structure (Frontend)

To ensure the **PDF Download** and **Audit Trail** work correctly, ensure your `src` folder is structured as follows:

```text
src/
├── App.js            # Main logic, Inventory, and Log Viewer
├── AuditReport.js    # PDF Generation Logic
├── App.css           # System Styling
└── index.js          # Entry point

```

---

## 📊 API Endpoints Used

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/login` | User authentication |
| `GET` | `/api/drugs` | Fetch all inventory |
| `POST` | `/api/drugs` | Add new drug (Admin only) |
| `GET` | `/api/admin/logs` | Fetch audit logs for table and PDF |

---

## 📝 Usage Instructions

1. **Login**: Enter your Admin credentials.
2. **Manage Stock**: Click **"Add New Drug"** to open the modal and update inventory.
3. **Audit Trail**: Scroll to the bottom to see the **User Activity History**.
4. **Download PDF**: Click the green **"Download PDF Report"** button to generate an instant professional report of all activities.

---

## ⚠️ Troubleshooting

* **PDF Error ("Could not generate PDF")**: Ensure your Backend is running on port `5000` and the token is valid.
* **Empty Logs**: Make sure the backend route `/api/admin/logs` is returning an array of data.
* **React Warnings**: This project uses `useCallback` to ensure high performance and zero ESLint dependency warnings.

---

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any features or bug fixes.

---

**Next Step**: Would you like me to help you write a **`package.json`** file or a **CSS** file to make this README look even better on your GitHub profile?
