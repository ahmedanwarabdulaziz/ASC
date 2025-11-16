# Authentication Setup Guide

## ✅ What's Been Implemented

1. **Database Schema** (`auth-setup.sql`)
   - Users table with roles (admin, supervisor, team_leader)
   - Password change tracking
   - Row Level Security policies

2. **Authentication Pages**
   - Login page (`/login`)
   - Password change page (`/change-password`)
   - Updated home page with login button

3. **User Management**
   - User management page (`/dashboard/users`)
   - Admin can create supervisors and team leaders
   - Supervisors can create team leaders
   - Default password: `123456` (forced change on first login)

4. **Route Protection**
   - Middleware for authentication
   - Role-based access control
   - Automatic redirects based on role

5. **Navigation**
   - User info display
   - Logout functionality
   - Role-based menu items

## 🚀 Setup Steps

### Step 1: Create Users Table

Run the SQL script in Supabase SQL Editor:

```bash
# Copy the contents of auth-setup.sql and run in Supabase SQL Editor
```

Or use the execute-sql command if you have the exec_sql function set up:

```bash
npm run execute-sql auth-setup.sql
```

### Step 2: Create Admin User

Run the setup script to create the admin user:

```bash
npm run setup-admin
```

This will create:
- Email: `x@x.com`
- Password: `Aa2025`
- Role: `admin`
- Must change password: `true`

### Step 3: Test Login

1. Go to the home page
2. Click "تسجيل الدخول"
3. Login with:
   - Email: `x@x.com`
   - Password: `Aa2025`
4. You'll be redirected to change password page
5. Set a new password
6. You'll be redirected to dashboard

## 📋 User Roles & Permissions

### Admin (`admin`)
- ✅ Full access to all features
- ✅ Create supervisors and team leaders
- ✅ Manage all members and teams
- ✅ Access user management page

### Supervisor (`supervisor`)
- ✅ View and manage members
- ✅ Assign members to teams
- ✅ Create team leaders
- ❌ Cannot create other supervisors
- ❌ Cannot access admin-only features

### Team Leader (`team_leader`)
- ✅ View assigned team members
- ✅ Update member status/notes
- ✅ Limited to their team
- ❌ Cannot create users
- ❌ Cannot access user management

## 🔐 Password Management

- **Admin initial password**: `Aa2025` (must change on first login)
- **New users default password**: `123456` (must change on first login)
- All users are forced to change password on first login
- Password change is tracked in the `users` table

## 📁 Files Created

- `auth-setup.sql` - Database schema
- `app/login/page.tsx` - Login page
- `app/change-password/page.tsx` - Password change page
- `app/dashboard/users/page.tsx` - User management page
- `app/api/users/create/route.ts` - API route for creating users
- `lib/auth.ts` - Authentication utilities
- `middleware.ts` - Route protection middleware
- `scripts/setup-admin-user.ts` - Admin user setup script
- Updated `components/Navigation.tsx` - User info and logout
- Updated `app/page.tsx` - Login button

## 🔄 Next Steps

After setup:
1. Login as admin
2. Create supervisor users
3. Create team leader users
4. Assign team leaders to teams
5. Start managing members!

## ⚠️ Important Notes

- The middleware protects all routes except `/`, `/login`, and `/members`
- Users must change password before accessing protected routes
- Team leaders are redirected to `/dashboard/teams` after login
- Admins and supervisors are redirected to `/dashboard` after login



