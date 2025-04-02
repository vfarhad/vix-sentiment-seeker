import { toast } from "sonner";
import { FMP_API_URL, FMP_API_KEY } from "@/config/apiConfig";

// This file is kept for compatibility but is no longer in use
// All API calls have been migrated to the FMP API service

// Placeholder function to prevent build errors
export const fetchPolygonQuote = async (symbol: string): Promise<any> => {
  console.warn("Polygon API service is deprecated, using FMP instead");
  throw new Error("Polygon API service is deprecated, use FMP API instead");
};

// Other placeholder functions if needed
