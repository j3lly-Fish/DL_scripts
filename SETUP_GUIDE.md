# Complete Setup Guide

## Step-by-Step Installation

### Step 1: Create Next.js Project

```bash
npx create-next-app@latest my-script-library --typescript --tailwind --app --no-src-dir
cd my-script-library
```

### Step 2: Install Dependencies

```bash
npm install class-variance-authority clsx tailwind-merge lucide-react bcryptjs jsonwebtoken jose
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

### Step 3: Create Folder Structure

```bash
# Create all directories
mkdir -p app/api/auth/login
mkdir -p app/api/auth/register
mkdir -p app/api/auth/logout
mkdir -p app/api/scripts/execute
mkdir -p app/api/scripts/[id]
mkdir -p app/api/audit-logs
mkdir -p "app/(auth)/login"
mkdir -p "app/(auth)/register"
mkdir -p "app/(dashboard)/dashboard"
mkdir -p "app/(dashboard)/scripts"
mkdir -p "app/(dashboard)/audit-logs"
mkdir -p "app/(dashboard)/admin"
mkdir -p components/ui
mkdir -p lib
```

### Step 4: Copy All Files

Copy the content from each artifact I created above into the corresponding file:

#### Root Configuration Files
1. `package.json` - Replace the default one
2. `.env.local` - Create new file
3. `tailwind.config.ts` - Replace the default one
4. `tsconfig.json` - Replace the default one
5. `next.config.js` - Replace the default one
6. `middleware.ts` - Create new file
7. `README.md` - Create new file

#### App Directory
8. `app/globals.css`
9. `app/layout.tsx`
10. `app/page.tsx`

#### Authentication Pages
11. `app/(auth)/login/page.tsx`
12. `app/(auth)/register/page.tsx`

#### Dashboard Pages
13. `app/(dashboard)/layout.tsx`
14. `app/(dashboard)/dashboard/page.tsx`
15. `app/(dashboard)/scripts/page.tsx`
16. `app/(dashboard)/audit-logs/page.tsx`
17. `app/(dashboard)/admin/page.tsx`

#### API Routes
18. `app/api/auth/login/route.ts`
19. `app/api/auth/register/route.ts`
20. `app/api/auth/logout/route.ts`
21. `app/api/scripts/route.ts`
22. `app/api/scripts/execute/route.ts`
23. `app/api/audit-logs/route.ts`

#### Library Files
24. `lib/types.ts`
25. `lib/utils.ts`
26. `lib/db.ts`
27. `lib/auth.ts`

#### Components
28. `components/Navbar.tsx`
29. `components/ui/button.tsx`
30. `components/ui/card.tsx`
31. `components/ui/input.tsx`
32. `components/ui/label.tsx`
33. `components/ui/table.tsx`
34. `components/ui/badge.tsx`
35. `components/ui/textarea.tsx`

### Step 5: Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6: Test the Application

1. **Login with default admin credentials**:
   - Email: admin@example.com
   - Password: admin123

2. **Or register a new user**:
   - Go to the register page
   - Fill in your details including a DB Tenant ID
   - Login with your new credentials

3. **Browse scripts**:
   - Navigate to the Scripts page
   - Select a script to view its code

4. **Execute a script** (note: sample scripts use example API endpoints):
   - Select a script
   - Enter a bearer token (use any test token like "test-token-12345")
   - Provide parameters in JSON format
   - Click Execute

5. **View audit logs**:
   - Check your execution history in Audit Logs
   - If admin, view all users' logs in the Admin dashboard

## File Checklist

Use this checklist to ensure all files are created:

- [ ] Root configuration files (7 files)
- [ ] App directory files (3 files)
- [ ] Authentication pages (2 files)
- [ ] Dashboard pages (5 files)
- [ ] API routes (6 files)
- [ ] Library files (4 files)
- [ ] Component files (8 files)

**Total: 35 files**

## Common Issues and Solutions

### Issue: Module not found errors
**Solution**: Make sure all dependencies are installed with `npm install`

### Issue: Authentication not working
**Solution**: Verify `.env.local` file exists and has JWT_SECRET set

### Issue: Styles not loading
**Solution**: Restart the dev server after adding `globals.css`

### Issue: TypeScript errors
**Solution**: Check all import paths use `@/` prefix correctly

### Issue: Middleware redirecting incorrectly
**Solution**: Clear browser cookies and try again

## Production Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Configure build command: `npm run build`
Configure start command: `npm start`

## Next Steps

1. Replace in-memory database with PostgreSQL + Prisma
2. Add proper API endpoints for your platform
3. Implement script creation UI for admins
4. Add script testing functionality
5. Implement proper error handling
6. Add loading states and optimistic UI updates
7. Set up proper logging and monitoring

## Support

If you encounter any issues:
1. Check that all files are created correctly
2. Verify all dependencies are installed
3. Ensure `.env.local` is configured
4. Clear `.next` folder and restart: `rm -rf .next && npm run dev`