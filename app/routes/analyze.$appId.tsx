import { useParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { countries } from "~/utils/constants";

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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchCountryData = async (country: string) => {
      try {
        const response = await fetch(`/analyze/country?appId=${appId}&country=${country}`);
        if (response.status === 404) {
          // App not available in this country, silently skip
          return null;
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${country}`);
        }
        const data = await response.json();
        return data;
      } catch (err) {
        console.error(`Error fetching ${country}:`, err);
        return null;
      }
    };

    const fetchAllCountries = async () => {
      if (!appId) return;

      setIsLoading(true);
      setError(null);
      setResults([]);
      setProgress(0);

      const allResults: AppDetails[] = [];
      let completedCount = 0;
      let errorCount = 0;

      for (const country of countries) {
        const result = await fetchCountryData(country);
        if (result) {
          allResults.push(result);
          if (result.country === 'us') {
            setUsTitle(result.title);
          }
        } else {
          errorCount++;
        }
        completedCount++;
        setProgress(Math.round((completedCount / countries.length) * 100));
      }

      if (allResults.length === 0) {
        setError('App not found in any country.');
      } else if (errorCount > 0) {
        console.log(`Completed with ${errorCount} countries unavailable`);
      }

      setResults(allResults);
      setIsLoading(false);
    };

    fetchAllCountries().catch(err => {
      console.error('Failed to fetch data:', err);
      setError('Failed to fetch app details. Please try again.');
      setIsLoading(false);
    });

    return () => {
      // Cleanup not needed anymore since we're not using EventSource
    };
  }, [appId]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
            Analyzing App Store Titles
          </h1>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-gray-600">Scanning app stores... {progress}%</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 mt-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Results</h2>
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