import { LoaderFunctionArgs } from "@remix-run/node";
import store from 'app-store-scraper';
import { countries } from "~/utils/constants";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const appId = url.searchParams.get("appId");

  if (!appId || isNaN(parseInt(appId))) {
    return new Response("Invalid app ID", { status: 400 });
  }

  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for (const country of countries) {
            try {
              const result = await store.app({ 
                id: parseInt(appId), 
                country 
              });
              
              controller.enqueue(`data: ${JSON.stringify({
                country,
                title: result.title,
                subtitle: result.subtitle || null,
                url: result.url
              })}\n\n`);

              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (err) {
              const error = err as Error;
              controller.enqueue(`data: ${JSON.stringify({
                error: `Failed for ${country}: ${error.message || 'Unknown error'}`
              })}\n\n`);
            }
          }
          controller.close();
        } catch (err) {
          const error = err as Error;
          controller.error(error);
        }
      }
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    }
  );
} 