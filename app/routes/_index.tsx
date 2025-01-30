import { Form, useActionData, useNavigate } from "@remix-run/react";
import { ActionFunctionArgs } from "@remix-run/node";
import store from 'app-store-scraper';

interface SearchResult {
  id: number;
  title: string;
  icon: string;
  developer: string;
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const appName = formData.get("appName") as string;

  try {
    const searchResults = await store.search({
      term: appName,
      num: 10,
      country: 'us'
    });

    if (searchResults.length === 0) {
      return { error: "No apps found" };
    }

    const formattedResults: SearchResult[] = searchResults.map(app => ({
      id: app.trackId || app.id,
      title: app.title,
      icon: app.icon,
      developer: app.developer
    }));

    return { searchResults: formattedResults };
  } catch (error) {
    return { error: "Failed to fetch app details" };
  }
}

export default function Index() {
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow p-8">
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-8">
            App Store Scanner
          </h1>
          
          <Form method="post" className="space-y-6">
            <div>
              <label 
                htmlFor="appName" 
                className="block text-sm font-medium text-gray-900"
              >
                Search App Store
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="appName"
                  id="appName"
                  required
                  className="block w-full rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="e.g. Candy Crush Saga"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Search Apps
            </button>
          </Form>

          {actionData?.error && (
            <div className="mt-6 rounded-lg bg-red-50 p-4">
              <div className="text-sm text-red-700">
                {actionData.error}
              </div>
            </div>
          )}

          {actionData?.searchResults && (
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
              <div className="grid gap-4">
                {actionData.searchResults.map((app) => (
                  <div 
                    key={app.id} 
                    className="flex items-center p-4 bg-white rounded-lg border border-gray-200"
                  >
                    <img 
                      src={app.icon} 
                      alt={app.title} 
                      className="w-16 h-16 rounded-xl mr-4"
                    />
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-900">{app.title}</h3>
                      <p className="text-sm text-gray-600">{app.developer}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/analyze/${app.id}`)}
                      className="ml-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Analyze
                    </button>
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
