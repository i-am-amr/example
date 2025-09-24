# Warranty Management System

A comprehensive warranty management system built with Next.js frontend and Node.js backend, featuring QR code generation, warranty registration, and WhatsApp campaign integration.

## 🚀 Features

### Core Features
- **Product Management**: Complete CRUD operations for products with SKU, warranty periods, and terms
- **QR Code Generation**: Unique QR codes for each product with automatic generation
- **Warranty Registration**: Customer-friendly registration process with QR code scanning
- **User Management**: Role-based access control with 5 user roles
- **City & Label Management**: Organize products and registrations by location and categories
- **Campaign System**: WhatsApp campaigns with advanced filtering and scheduling
- **Export/Import**: Excel/CSV export functionality for data analysis
- **Settings Management**: Configurable warranty terms and message templates

### User Roles
- **Superadmin**: Full system access and user management
- **Admin**: Product and registration management
- **Agent**: View registrations and assist customers
- **Marketer**: Create and manage campaigns
- **Viewer**: Read-only access to registrations

### Technical Features
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Integration**: Scalable NoSQL database
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live dashboard statistics
- **Error Handling**: Comprehensive error management
- **Rate Limiting**: API protection against abuse

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd warranty-management-system
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 4. Environment Configuration

Create `.env.local` in the root directory:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/warranty-system

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# WhatsApp API (Optional)
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# Server
SERVER_PORT=5000
NODE_ENV=development
```

Create `server/.env`:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/warranty-system

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development

# WhatsApp API Configuration (Optional)
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# Twilio Configuration (Optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Email Configuration (Optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 5. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Using systemd (Linux)
sudo systemctl start mongod

# Using Homebrew (macOS)
brew services start mongodb-community

# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 🚀 Running the Application

### Development Mode

#### Option 1: Run Both Frontend and Backend Separately
```bash
# Terminal 1 - Start Backend Server
cd server
npm run dev

# Terminal 2 - Start Frontend
npm run dev
```

#### Option 2: Run Both Together
```bash
npm run dev:full
```

### Production Mode
```bash
# Build the application
npm run build

# Start the application
npm start
```

## 📱 Usage

### 1. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Dashboard**: http://localhost:3000/admin
- **Warranty Registration**: http://localhost:3000/register

### 2. Initial Setup
1. Create a superadmin user through the registration endpoint
2. Login to the admin dashboard
3. Configure cities and labels
4. Add your first product
5. Generate QR codes for products

### 3. Customer Registration Process
1. Customer scans QR code or enters QR code manually
2. System verifies the product
3. Customer fills in their details
4. Warranty is registered and confirmed

## 🏗️ Project Structure

```
warranty-management-system/
├── app/                          # Next.js app directory
│   ├── admin/                    # Admin dashboard pages
│   │   ├── layout.tsx           # Admin layout component
│   │   ├── login/               # Admin login page
│   │   └── page.tsx             # Admin dashboard
│   ├── register/                # Customer registration page
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── server/                       # Backend server
│   ├── controllers/             # Route controllers
│   ├── middleware/              # Custom middleware
│   ├── models/                  # MongoDB models
│   ├── routes/                  # API routes
│   ├── utils/                   # Utility functions
│   ├── .env                     # Server environment variables
│   ├── index.js                 # Server entry point
│   └── package.json             # Server dependencies
├── .env.local                   # Frontend environment variables
├── next.config.js               # Next.js configuration
├── package.json                 # Frontend dependencies
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # This file
```

## 🗄️ Database Models

### User Model
- Authentication and authorization
- Role-based permissions
- User profile information

### Product Model
- Product information and specifications
- QR code data and generation
- Warranty terms and periods

### Registration Model
- Customer warranty registrations
- Warranty status tracking
- Verification and approval workflow

### City Model
- Geographic organization
- Agent and distributor management

### Label Model
- Product categorization
- Visual organization with colors

### Campaign Model
- WhatsApp campaign management
- Target audience filtering
- Scheduling and delivery settings

### SendLog Model
- Message delivery tracking
- Campaign performance analytics
- Retry and error handling

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/:id/stats` - Get product statistics
- `GET /api/products/:id/qr` - Generate QR code

### Registrations
- `GET /api/registrations` - Get all registrations
- `GET /api/registrations/:id` - Get single registration
- `POST /api/registrations` - Create registration
- `POST /api/registrations/verify` - Verify QR code
- `PUT /api/registrations/:id` - Update registration
- `PUT /api/registrations/:id/verify` - Verify registration status
- `GET /api/registrations/stats` - Get registration statistics

### Cities
- `GET /api/cities` - Get all cities
- `GET /api/cities/:id` - Get single city
- `POST /api/cities` - Create city
- `PUT /api/cities/:id` - Update city
- `DELETE /api/cities/:id` - Delete city

### Labels
- `GET /api/labels` - Get all labels
- `GET /api/labels/:id` - Get single label
- `POST /api/labels` - Create label
- `PUT /api/labels/:id` - Update label
- `DELETE /api/labels/:id` - Delete label

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/activate` - Activate/deactivate user

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `GET /api/campaigns/:id` - Get single campaign
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:id` - Update campaign
- `POST /api/campaigns/:id/start` - Start campaign
- `POST /api/campaigns/:id/pause` - Pause campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Settings
- `GET /api/settings` - Get all settings
- `GET /api/settings/:category` - Get settings by category
- `PUT /api/settings/:category` - Update settings
- `POST /api/settings/:category/reset` - Reset settings to default
- `GET /api/settings/templates/preview` - Preview message template

### Export
- `POST /api/export/registrations` - Export registrations to Excel/CSV
- `POST /api/export/products` - Export products to Excel/CSV
- `GET /api/export/template/registrations` - Download import template

## 🔧 Configuration

### MongoDB Connection
Update the `MONGODB_URI` in your environment files to point to your MongoDB instance.

### JWT Configuration
Set a strong `JWT_SECRET` for production use. Generate a secure random string.

### WhatsApp Integration (Optional)
Configure WhatsApp Business API credentials for campaign functionality:
- WhatsApp Cloud API
- Twilio WhatsApp API
- 360dialog WhatsApp API

## 🚀 Deployment

### Frontend Deployment (Vercel)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Backend Deployment (Railway/Heroku)
1. Create a new project on your preferred platform
2. Connect your repository
3. Set environment variables
4. Deploy the server

### Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Get connection string
3. Update `MONGODB_URI` in environment variables

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
```

### Frontend Testing
```bash
npm test
```

## 📊 Monitoring

### Health Check
- `GET /api/health` - Server health status

### Logging
- Winston logger for server-side logging
- Console logging for development

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🎯 Project Status

### ✅ Completed Features
- ✅ **Complete Project Structure**: Next.js frontend + Node.js backend
- ✅ **MongoDB Integration**: All models and database operations
- ✅ **Authentication System**: JWT-based auth with role-based permissions
- ✅ **Product Management**: Full CRUD with QR code generation
- ✅ **Warranty Registration**: Customer-friendly registration process
- ✅ **Admin Dashboard**: Complete management interface
- ✅ **User Management**: 5 user roles with specific permissions
- ✅ **City & Label Management**: Geographic and categorical organization
- ✅ **WhatsApp Campaign System**: Advanced campaign management
- ✅ **Export/Import**: Excel/CSV data export functionality
- ✅ **Settings Management**: Configurable terms and templates
- ✅ **API Documentation**: Complete REST API with validation
- ✅ **Security Features**: Rate limiting, CORS, input validation
- ✅ **Deployment Ready**: Production configuration and guides

### 🔄 Ready for Enhancement
- 📱 Mobile app development
- 📊 Advanced analytics dashboard
- 🔗 Third-party integrations
- 🌍 Multi-language support
- 🤖 AI-powered insights
- 📈 Advanced reporting features

---

**Built with ❤️ using Next.js, Node.js, and MongoDB**