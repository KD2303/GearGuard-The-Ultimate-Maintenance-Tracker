# GearGuard Production Deployment Guide

## Prerequisites

- Node.js 18+ installed
MongoDB (local or Atlas) accessible
- Git (for version control)

## Step 1: Database Setup

### Install MongoDB (if not already installed)
- Local: https://www.mongodb.com/try/download/community
- Atlas (cloud): https://www.mongodb.com/cloud/atlas
Install or create a cluster and note the connection string (MONGO_URI).

### Create Database
For local MongoDB, the database will be created automatically on first write. For Atlas, create a cluster and copy the connection string into your `.env` as `MONGO_URI`.

## Step 2: Environment Configuration

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your database connection string:
  ```
  PORT=5000
  MONGO_URI=mongodb://localhost:27017/gearguard
  NODE_ENV=production
  ```

## Step 3: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

## Step 4: Build Frontend for Production

```bash
cd client
npm run build
cd ..
```

## Step 5: Start the Application

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will:
- Backend API: http://localhost:5000
- Frontend (dev): http://localhost:3000
- Production: Serve frontend from backend at http://localhost:5000

## Step 6: Initial Setup

1. Open the application in your browser
2. Create your first maintenance team
3. Add team members
4. Add equipment
5. Start creating maintenance requests

## Database Migrations

The application uses MongoDB. Models are managed via Mongoose. If you need to migrate existing SQL data, export to JSON and import using `mongoimport` or write a Node migration script.

## Production Deployment Options

### Option 1: Traditional Server (VPS/Dedicated)

1. Install Node.js and MongoDB on server (or point `MONGO_URI` at your Atlas cluster)
2. Clone repository
3. Configure `.env` with production values
4. Run `npm install` and `cd client && npm install && npm run build`
5. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name gearguard
   pm2 startup
   pm2 save
   ```
6. Configure Nginx as reverse proxy (optional)

### Option 2: Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mongo:
    image: mongo:6
    restart: unless-stopped
    environment:
      MONGO_INITDB_DATABASE: gearguard
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      MONGO_URI: mongodb://mongo:27017/gearguard
      NODE_ENV: production
    depends_on:
      - mongo

volumes:
  mongo_data:
```

### Option 3: Cloud Platforms

#### Heroku
1. Create Heroku app
2. Use a MongoDB addon or configure `MONGO_URI` to point to an Atlas cluster
3. Set environment variables
4. Deploy via Git

#### Railway/Render
1. Connect GitHub repository
2. Add MongoDB database or set `MONGO_URI` to your Atlas cluster
3. Configure environment variables
4. Deploy automatically

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGO_URI | MongoDB connection string | mongodb://localhost:27017/gearguard |
| NODE_ENV | Environment | development |

## Troubleshooting

### Database Connection Issues
- Ensure MongoDB is running or `MONGO_URI` is correct
- Check connection string in `.env`
- Ensure your MongoDB instance/cluster is accessible

### Port Already in Use
- Change PORT in `.env`
- Kill process using the port

### Build Errors
- Clear node_modules and reinstall
- Check Node.js version (18+)

## Security Considerations for Production

1. Use strong database passwords
2. Enable HTTPS with SSL certificate
3. Implement authentication/authorization
4. Add rate limiting
5. Regular database backups
6. Update dependencies regularly

## Backup Strategy

### Database Backup
```bash
# Dump
mongodump --uri "$MONGO_URI" --archive=backup.archive --gzip

# Restore
mongorestore --uri "$MONGO_URI" --archive=backup.archive --gzip
```

## Support

For issues or questions, refer to:
- README.md
- API documentation
- Database schema in models/

## License

MIT
