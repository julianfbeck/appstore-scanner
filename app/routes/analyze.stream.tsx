import { LoaderFunctionArgs } from "@remix-run/node";
import store from 'app-store-scraper';
import { countries } from '~/utils/constants';

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("SSE Stream started");
  const url = new URL(request.url);
  const appId = url.searchParams.get("appId");
  const processedCountriesParam = url.searchParams.get("countries");
  const processedCountries = processedCountriesParam ? new Set(processedCountriesParam.split(',')) : new Set();

  if (!appId || isNaN(parseInt(appId))) {
    console.error("Invalid app ID:", appId);
    return new Response("Invalid app ID", { 
      status: 400,
      statusText: "Bad Request" 
    });
  }

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "Access-Control-Allow-Origin": "*"
  });

  let messageCount = 0;

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          const remainingCountries = countries.filter(country => !processedCountries.has(country));
          console.log(`Processing ${remainingCountries.length} remaining countries...`);

          for (const country of remainingCountries) {
            try {
              console.log(`Fetching data for ${country}...`);
              const result = await store.app({ 
                id: parseInt(appId), 
                country 
              });
              
              const message = {
                country,
                title: result.title,
                subtitle: result.subtitle || null,
                url: result.url
              };

              console.log(`Success for ${country}:`, message);
              controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
              messageCount++;

              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
              const error = err as Error;
              console.error(`Failed for ${country}:`, error);
              controller.enqueue(`data: ${JSON.stringify({
                error: `Failed for ${country}: ${error.message || 'Unknown error'}`
              })}\n\n`);
            }
          }
          
          controller.enqueue(`data: ${JSON.stringify({ complete: true })}\n\n`);
          console.log(`Stream completed. Sent ${messageCount} messages.`);
          controller.close();
        } catch (err) {
          const error = err as Error;
          console.error("Stream error:", error);
          controller.enqueue(`data: ${JSON.stringify({
            error: `Stream error: ${error.message || 'Unknown error'}`
          })}\n\n`);
          controller.close();
        }
      }
    }),
    { headers }
  );
} 