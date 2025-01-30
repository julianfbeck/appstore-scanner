import { LoaderFunctionArgs, json } from "@remix-run/node";
import store from 'app-store-scraper';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const appId = url.searchParams.get("appId");
  const country = url.searchParams.get("country");

  if (!appId || isNaN(parseInt(appId))) {
    return new Response("Invalid app ID", { 
      status: 400,
      statusText: "Bad Request" 
    });
  }

  if (!country) {
    return new Response("Country is required", { 
      status: 400,
      statusText: "Bad Request" 
    });
  }

  try {
    console.log(`Fetching data for ${country}...`);
    const result = await store.app({ 
      id: parseInt(appId), 
      country 
    });
    
    return json({
      country,
      title: result.title,
      subtitle: result.subtitle || null,
      url: result.url
    });
  } catch (err) {
    const error = err as Error;
    console.error(`Failed for ${country}:`, error);
    
    // Return 404 status for "App not found" errors
    if (error.message?.includes("App not found")) {
      return new Response(null, { 
        status: 404,
        statusText: "Not Found" 
      });
    }
    
    return new Response(`Failed to fetch data for ${country}`, { 
      status: 500,
      statusText: "Internal Server Error" 
    });
  }
} 