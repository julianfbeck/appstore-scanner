import { useParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import { json, LoaderFunctionArgs } from "@remix-run/node";

interface AppDetails {
  country: string;
  title: string;
  subtitle: string | null;
  url: string;
}

// Add a loader to handle the initial request
export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.appId || isNaN(parseInt(params.appId))) {
    throw new Response("Invalid App ID", { status: 400 });
  }
  return json({ appId: params.appId });
}

export default function Analyze() {
  const { appId } = useParams();
  const [results, setResults] = useState<AppDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usTitle, setUsTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const setupEventSource = () => {
      if (!appId) return;

      console.log("Setting up EventSource...");
      eventSource = new EventSource(`/analyze/stream?appId=${appId}`);
      
      eventSource.onmessage = (event) => {
        try {
          console.log("Received message:", event.data);
          const data = JSON.parse(event.data);
          
          if (data.complete) {
            console.log("Stream completed");
            setIsLoading(false);
            eventSource?.close();
            return;
          }

          if (data.error) {
            console.error("Stream error:", data.error);
            setError(data.error);
            return;
          }

          setResults(prev => {
            if (data.country === 'us') {
              setUsTitle(data.title);
            }
            const newResults = [...prev, data];
            console.log("Updated results:", newResults);
            return newResults;
          });
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSource.onerror = (event) => {
        console.error('SSE Error:', event);
        setError("Connection lost. Please try again.");
        setIsLoading(false);
        if (eventSource?.readyState === EventSource.CLOSED) {
          console.log("Connection closed");
        } else {
          console.log("Attempting to reconnect...");
        }
      };

      eventSource.onopen = () => {
        console.log("SSE Connection opened");
        setIsLoading(true);
        setError(null);
      };
    };

    setupEventSource();

    return () => {
      if (eventSource) {
        console.log("Cleaning up EventSource");
        eventSource.close();
        setIsLoading(false);
      }
    };
  }, [appId]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
            Analyzing App Store Titles
          </h1>

          {isLoading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Scanning app stores...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 mt-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Results</h2>
                {isLoading && (
                  <span className="text-sm text-gray-500">Still scanning...</span>
                )}
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {results
                  .filter(result => result.country !== 'us' && result.title !== usTitle)
                  .map((result) => (
                    <div 
                      key={result.country} 
                      className="rounded-lg bg-white p-6 shadow border border-gray-200 animate-fade-in"
                    >
                      <div className="space-y-3">
                        <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1">
                          <span className="text-sm font-medium text-indigo-700">
                            {result.country.toUpperCase()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Local Title</p>
                          <p className="font-medium text-gray-900">{result.title}</p>
                        </div>
                        {result.subtitle && (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">Subtitle</p>
                            <p className="font-medium text-gray-800">{result.subtitle}</p>
                          </div>
                        )}
                        {usTitle && (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">US Title</p>
                            <p className="font-medium text-gray-900">{usTitle}</p>
                          </div>
                        )}
                        <a 
                          href={result.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                          View in App Store
                          <svg className="ml-1 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 