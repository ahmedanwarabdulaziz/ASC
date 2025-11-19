import { redirect } from 'next/navigation';

export default async function BlogPostPage({
  params,
}: {
  params: { id: string };
}) {
  // Redirect to blog page - we don't use individual pages anymore
  // All images are shown in gallery cards with lightbox
  redirect('/blog');
}
