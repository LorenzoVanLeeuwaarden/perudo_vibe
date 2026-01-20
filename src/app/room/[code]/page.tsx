import RoomPageClient from './RoomPageClient';

// Generate a placeholder param for static export - actual routing handled by _redirects and client-side
export async function generateStaticParams() {
  return [{ code: 'PLACEHOLDER' }];
}

export default function RoomPage() {
  return <RoomPageClient />;
}
