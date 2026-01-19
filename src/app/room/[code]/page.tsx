import RoomPageClient from './RoomPageClient';

// Static export requires dynamicParams = false
// SPA routing via _redirects will serve this page for all /room/* routes
// Client-side code extracts the actual room code from the URL
export const dynamicParams = false;

// Generate a placeholder param - actual routing handled by _redirects and client-side
export async function generateStaticParams() {
  // Return a placeholder room code - the _redirects file ensures all /room/* requests
  // serve this page and client-side code extracts the actual room code from the URL
  return [{ code: 'PLACEHOLDER' }];
}

export default function RoomPage() {
  return <RoomPageClient />;
}
