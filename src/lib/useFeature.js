"use client";

import { useAuth } from "@/lib/AuthContext";

export function useFeature(feature) {
  const { organization } = useAuth();
  if (!organization?.features) return false;
  return organization.features.includes(feature);
}

export function useFeatures() {
  const { organization } = useAuth();
  return organization?.features || [];
}
