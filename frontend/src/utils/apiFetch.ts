// import { useAuth } from "../context/AuthContext";

// export function useApiFetch() {
//   const { logoutUser } = useAuth();

//   // low-level fetch with automatic session expiration handling
//   async function apiFetch<T = any>(
//     url: string,
//     options: RequestInit = {}
//   ): Promise<T> {
//     const res = await fetch(url, {
//       ...options,
//       credentials: "include",
//       headers: {
//         "Content-Type": "application/json",
//         ...(options.headers || {}),
//       },
//     });

//     if (res.status === 401) {
//       try {
//         const data = await res.json();
//         if (data?.error === "TokenExpiredError" || data?.error === "Unauthorized") {
//           console.warn("Session expired — logging out user");
//           await logoutUser();
//           window.location.href = "/exit?reason=sessionExpired";
//           const sessionError = new Error("Session expired");
//           (sessionError as any).sessionExpired = true;
//           return Promise.reject(sessionError);
//         }
//       } catch {
//         window.location.href = "/exit?reason=sessionExpired";
//         const sessionError = new Error("Session expired");
//         (sessionError as any).sessionExpired = true;
//         return Promise.reject(sessionError);
//       }
//     }

//     if (!res.ok) {
//       const errText = await res.text();
//       throw new Error(errText || `HTTP error ${res.status}`);
//     }

//     return res.json() as Promise<T>;
//   }

//   // high-level wrapper for UI, automatically handles setErr
//   async function safeApiFetch<T>(
//     fetchFn: () => Promise<T>,
//     setErr: React.Dispatch<React.SetStateAction<string | null>>,
//     fallbackMsg: string
//   ): Promise<T | undefined> {
//     try {
//       return await fetchFn();
//     } catch (e: any) {
//       if ((e as any)?.sessionExpired) return; // let apiFetch handle redirect
//       setErr(fallbackMsg);
//     }
//   }

//   return { apiFetch, safeApiFetch };
// }



import { useAuth } from "../context/AuthContext";

export function useApiFetch() {
const { logoutUser } = useAuth();

// low-level fetch with automatic session expiration handling
async function apiFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
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
		return Promise.reject(sessionError);
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
