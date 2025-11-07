import { useAuth } from "../context/AuthContext";

export function useApiFetch() {
const { logoutUser } = useAuth();

// low-level fetch with automatic session expiration handling
async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T>
	{
	const res = await fetch(url, {
		...options,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {}),
		},
	});

	if (res.status === 401) {
	// redirect immediately
		console.warn("Session expired — logging out user");
		await logoutUser();
		window.location.href = "/exit?reason=sessionExpired";
		const sessionError = new Error("Session expired");
		(sessionError as any).sessionExpired = true;
		throw sessionError;
	}

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(errText || `HTTP error ${res.status}`);
	}

	// only parse JSON if response is OK
	return res.json() as Promise<T>;
}

return apiFetch;
}
