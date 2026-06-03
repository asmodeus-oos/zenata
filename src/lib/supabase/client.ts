import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gutdmchtstwwtuvsdfbv.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1dGRtY2h0c3R3d3R1dnNkZmJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODIyMTgsImV4cCI6MjA5NDE1ODIxOH0.vzJa_3P2m7WFXJFm9y2sXE2ZC9iOVn3-SGpg5R1rpxM"
  );
}
