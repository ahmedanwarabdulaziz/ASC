# Supabase Storage Setup for Blog Images

## Step 1: Create Storage Bucket

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/xkbiqoajqxlvxjcwvhzv/storage/buckets
2. Click **"New bucket"**
3. Configure:
   - **Name**: `blog-images`
   - **Public bucket**: ✅ **YES** (check this!)
   - Click **"Create bucket"**

## Step 2: Set Storage Policies (Optional but Recommended)

The API route uses admin client, so policies are not strictly required, but you can add them for extra security:

1. Go to Storage → `blog-images` → Policies
2. Click **"New policy"**
3. Create a policy for authenticated admins:

**Policy Name**: "Admins can upload images"
**Allowed operation**: INSERT
**Policy definition**:
```sql
(EXISTS (
  SELECT 1 FROM users
  WHERE id = auth.uid() AND role = 'admin'
))
```

**Policy Name**: "Public can read images"
**Allowed operation**: SELECT
**Policy definition**:
```sql
true
```

## Step 3: Test Upload

After creating the bucket, try uploading an image again. The API route will handle the upload using admin credentials.

## Troubleshooting

### Error 400: Bad Request
- Make sure the bucket `blog-images` exists
- Make sure the bucket is set to **Public**
- Check browser console for detailed error messages

### Error 401: Unauthorized
- Make sure you're logged in as admin
- Check that your session is valid

### Error 403: Forbidden
- Make sure your user has `admin` role in the `users` table

