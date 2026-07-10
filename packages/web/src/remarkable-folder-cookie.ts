export const REMARKABLE_FOLDER_COOKIE_NAME = "remarkable-folder";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export function buildRemarkableFolderCookieAssignment(folder: string): string {
	const trimmedFolder = folder.trim();

	if (!trimmedFolder) {
		return `${REMARKABLE_FOLDER_COOKIE_NAME}=; path=/; max-age=0`;
	}

	return `${REMARKABLE_FOLDER_COOKIE_NAME}=${encodeURIComponent(trimmedFolder)}; path=/; max-age=${ONE_YEAR_IN_SECONDS}`;
}

export function readRemarkableFolderCookie(cookieHeader: string): string {
	const cookiePrefix = `${REMARKABLE_FOLDER_COOKIE_NAME}=`;
	const match = cookieHeader
		.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(cookiePrefix));

	if (!match) {
		return "";
	}

	const rawValue = match.slice(cookiePrefix.length);

	try {
		return decodeURIComponent(rawValue);
	} catch {
		return "";
	}
}
