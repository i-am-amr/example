# Deployment Guide

This guide covers deploying the Warranty Management System to various platforms.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- MongoDB database (local or cloud)
- Git repository access

### Local Development Setup
```bash
# Clone repository
git clone <repository-url>
cd warranty-management-system

# Install dependencies
npm install
cd server && npm install && cd ..

# Set up environment variables
cp .env.local.example .env.local
cp server/.env.example server/.env

# Start MongoDB (if running locally)
mongod

# Seed database (optional)
cd server && node seed.js && cd ..

# Start development servers
npm run dev:full
```

## 🌐 Production Deployment

### 1. Environment Setup

#### Frontend Environment (.env.local)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/warranty-system
JWT_SECRET=your-super-secure-jwt-secret-key
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-nextauth-secret
WHATSAPP_API_URL=https://graph.facebook.com
WHATSAPP_API_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
SERVER_PORT=5000
NODE_ENV=production
```

#### Backend Environment (server/.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/warranty-system
JWT_SECRET=your-super-secure-jwt-secret-key
PORT=5000
NODE_ENV=production
WHATSAPP_API_URL=https://graph.facebook.com
WHATSAPP_API_TOKEN=your-whatsapp-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-webhook-verify-token
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-number
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Database Setup

#### MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create database user
4. Whitelist your IP addresses
5. Get connection string
6. Update `MONGODB_URI` in environment files

#### Local MongoDB
```bash
# Install MongoDB
# Ubuntu/Debian
sudo apt-get install mongodb

# macOS
brew install mongodb-community

# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
```

### 3. Frontend Deployment

#### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables

#### Manual Server Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

### 4. Backend Deployment

#### Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

#### Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret

# Deploy
git push heroku main
```

#### DigitalOcean App Platform
1. Create new app from GitHub
2. Configure build and run commands
3. Set environment variables
4. Deploy

#### Manual Server Deployment
```bash
# Install PM2 for process management
npm install -g pm2

# Start server with PM2
cd server
pm2 start index.js --name "warranty-server"

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. Domain and SSL Setup

#### Custom Domain
1. Purchase domain from provider
2. Configure DNS records
3. Point domain to your hosting platform

#### SSL Certificate
- Vercel/Netlify: Automatic SSL
- Heroku: Automatic SSL for paid plans
- Manual: Use Let's Encrypt with Certbot

### 6. WhatsApp Integration Setup

#### WhatsApp Business API
1. Create Facebook Developer account
2. Create WhatsApp Business app
3. Get API credentials
4. Configure webhook URL
5. Set up message templates

#### Webhook Configuration
```
Webhook URL: https://yourdomain.com/api/webhook/whatsapp
Verify Token: your-webhook-verify-token
```

### 7. Monitoring and Logging

#### Application Monitoring
- Vercel Analytics (for frontend)
- Heroku Metrics (for backend)
- PM2 Monitoring (for manual deployment)

#### Error Tracking
- Sentry integration
- LogRocket for user sessions
- Custom logging with Winston

### 8. Backup and Security

#### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb+srv://..." --out=backup/

# Restore
mongorestore --uri="mongodb+srv://..." backup/
```

#### Security Checklist
- [ ] Strong JWT secrets
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Input validation enabled
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] Regular security updates

### 9. Performance Optimization

#### Frontend Optimization
- Enable Next.js Image Optimization
- Configure CDN
- Enable compression
- Optimize bundle size

#### Backend Optimization
- Enable MongoDB indexing
- Configure caching
- Optimize database queries
- Use connection pooling

### 10. Maintenance

#### Regular Tasks
- Monitor application logs
- Update dependencies
- Backup database
- Check SSL certificates
- Review security settings

#### Scaling Considerations
- Use MongoDB Atlas for database scaling
- Implement Redis for caching
- Use CDN for static assets
- Consider microservices architecture

## 🔧 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check MongoDB connection
mongo "mongodb+srv://username:password@cluster.mongodb.net/warranty-system"

# Test connection from application
curl http://localhost:5000/api/health
```

#### Environment Variables
```bash
# Check environment variables
echo $MONGODB_URI
echo $JWT_SECRET
```

#### Port Conflicts
```bash
# Check port usage
lsof -i :3000
lsof -i :5000

# Kill process if needed
kill -9 <PID>
```

### Logs and Debugging

#### Application Logs
```bash
# PM2 logs
pm2 logs warranty-server

# Heroku logs
heroku logs --tail

# Vercel logs
vercel logs
```

#### Database Logs
```bash
# MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Review platform-specific documentation
5. Contact support team

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install
cd server && npm install && cd ..

# Restart services
pm2 restart warranty-server  # If using PM2
# Or redeploy on your platform
```

### Database Migrations
```bash
# Run seed script for new data
cd server && node seed.js && cd ..
```

---

**Note**: Always test deployments in a staging environment before deploying to production.