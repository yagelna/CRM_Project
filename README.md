# CRM System for Electronic Component Brokers

This repository contains the source code for a **CRM system** designed specifically for electronic component brokers. The system allows companies to manage RFQs, inventory, contacts, and associated companies efficiently.

---

## **Features**

- **RFQ Management**: Track, create, edit, and manage Requests for Quotations (RFQs).
- **Inventory Management**: Maintain records of available components and quantities.
- **Contact Management**: Manage customer and supplier contact details.
- **Company Management**: Link contacts and RFQs to their respective companies.
- **Email Integration**: Automatically generate RFQs from customer emails.
- **Authentication**: Secure user authentication with custom user models and token-based access.
- **WebSocket Updates**: Real-time updates for RFQs.

---

## **Technologies Used**

### **Frontend**
- **React**: For building a responsive and dynamic user interface.
- **Ag-Grid**: To display and manage complex tabular data.
- **Bootstrap**: For consistent, mobile-first design.
- **Axios**: To handle HTTP requests.

### **Backend**
- **Django**: RESTful backend using Django's REST Framework.
- **Django Channels**: WebSocket support for real-time updates.
- **PostgreSQL**: Relational database management system.
- **Knox**: Token-based authentication.

---

## **Installation**

### **Backend Setup**
1. Clone the repository:
   ```bash
   git clone https://github.com/yagelna/CRM_Project.git
   ```
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use venv\Scripts\activate
   ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. Start the development server using Uvicorn:
   ```bash
   uvicorn crm_project.asgi:application --host 0.0.0.0 --port 8000
   ```

### **Frontend Setup**
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## **Usage**

1. Visit the frontend application at `http://localhost:3000`.
2. Log in using your credentials or create a new account (if enabled).
3. Navigate between RFQs, Inventory, Contacts, and Companies using the sidebar.
4. Use real-time updates and search functionality for streamlined workflow.
5. Leverage email integration to automatically generate RFQs from customer emails.
---

## **Future Enhancements**

- Advanced analytics and reporting.
- Integration with third-party APIs (e.g., Digi-Key, Mouser).
- Enhanced role-based access control (RBAC).
- Intelligent part number analysis.
- Smart cataloging using images.
- Automatic label generation.
