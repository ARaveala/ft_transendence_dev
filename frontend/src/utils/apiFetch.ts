import { useAuth } from "../context/AuthContext";

export function useApiFetch() {
const { logoutUser } = useAuth();

// low-level fetch with automatic session expiration handling
async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<{res: Response; data: T}>
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

	let data: T;
		try {
			data = await res.clone().json();
		} catch {
			data = {} as T;
		}

		return { res, data };
	}

return apiFetch;
}
