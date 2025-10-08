# Script Library - API Script Management Platform

A full-stack Next.js application for managing and executing API scripts with bearer token authentication, user management, and comprehensive audit logging.

## Features

- **User Authentication**: Secure login/register with JWT tokens
- **Script Library**: Browse and execute pre-configured API scripts
- **Bearer Token Integration**: Securely execute scripts with your API tokens
- **Audit Logging**: Complete execution history for all users
- **Admin Dashboard**: System-wide oversight and user management
- **Role-Based Access Control**: User and Admin roles with different permissions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: JWT with jose library
- **Password Hashing**: bcryptjs
- **Icons**: Lucide React
- **Language**: TypeScript

## Project Structure

```
my-script-library/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Protected dashboard pages
│   ├── api/                 # API routes
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── Navbar.tsx
├── lib/
│   ├── auth.ts             # Authentication utilities
│   ├── db.ts               # In-memory database
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
└── middleware.ts           # Route protection
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 4. Default Admin Credentials

- **Email**: admin@example.com
- **Password**: admin123

## Usage

### For Users

1. **Register**: Create an account with your email, password, and DB Tenant ID
2. **Browse Scripts**: View available API scripts in the library
3. **Execute Scripts**: Provide your bearer token and parameters to run scripts
4. **View Audit Logs**: Check your execution history

### For Admins

- Access the Admin Dashboard to view system-wide audit logs
- Monitor all user activities
- View system statistics

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Scripts
- `GET /api/scripts` - Get all scripts
- `POST /api/scripts` - Create new script (admin only)
- `POST /api/scripts/execute` - Execute a script

### Audit Logs
- `GET /api/audit-logs` - Get audit logs (filtered by role)

## Database

Currently uses an in-memory database for demonstration. For production:

1. Replace `lib/db.ts` with a real database solution
2. Recommended: Prisma ORM with PostgreSQL
3. Set up proper database migrations
4. Add data persistence

## Security Considerations

⚠️ **Production Checklist**:

- [ ] Change JWT_SECRET to a strong random value
- [ ] Implement proper database with encryption
- [ ] Add rate limiting to API routes
- [ ] Implement HTTPS in production
- [ ] Add input validation and sanitization
- [ ] Implement proper error logging
- [ ] Set up CORS policies
- [ ] Add API key rotation mechanism
- [ ] Implement session management
- [ ] Add 2FA for admin accounts

## Future Enhancements

- Script versioning
- Script categories and tagging
- Advanced search and filtering
- Export audit logs to CSV
- Real-time execution status
- Scheduled script execution
- Script templates
- Multi-tenant support
- WebSocket for real-time updates

## License

MIT

## Support

For issues or questions, please create an issue in the repository.