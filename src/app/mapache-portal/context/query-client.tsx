"use client";

 import * as React from "react";

 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

 type MapachePortalQueryProviderProps = {
   children: React.ReactNode;
 };

 function createQueryClient() {
   return new QueryClient({
     defaultOptions: {
       queries: {
         refetchOnWindowFocus: false,
         staleTime: 60_000,
         gcTime: 15 * 60_000,
         retry: 1,
       },
     },
   });
 }

 export function MapachePortalQueryProvider({
  children,
}: MapachePortalQueryProviderProps) {
  const clientRef = React.useRef<QueryClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = createQueryClient();
  }

  return (
    <QueryClientProvider client={clientRef.current!}>
      {children}
    </QueryClientProvider>
  );
}
