declare module 'app-store-scraper' {
	interface SearchOptions {
		term: string;
		num?: number;
		country?: string;
		lang?: string;
	}

	interface AppOptions {
		id: number;
		country?: string;
	}

	interface AppResult {
		id: number;
		trackId?: number;
		appId: string;
		title: string;
		url: string;
		description: string;
		icon: string;
		genres: string[];
		genreIds: string[];
		primaryGenre: string;
		primaryGenreId: number;
		contentRating: string;
		languages: string[];
		size: string;
		requiredOsVersion: string;
		released: string;
		updated: string;
		releaseNotes: string;
		version: string;
		price: number;
		currency: string;
		free: boolean;
		developerId: number;
		developer: string;
		developerUrl: string;
		developerWebsite: string;
		score: number;
		reviews: number;
		currentVersionScore: number;
		currentVersionReviews: number;
		screenshots: string[];
		ipadScreenshots: string[];
		appletvScreenshots: string[];
		supportedDevices: string[];
		subtitle?: string;
	}

	interface Store {
		search(opts: SearchOptions): Promise<AppResult[]>;
		app(opts: AppOptions): Promise<AppResult>;
	}

	const store: Store;
	export default store;
} 