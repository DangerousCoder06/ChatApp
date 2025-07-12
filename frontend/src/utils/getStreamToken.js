const API_URL = import.meta.env.VITE_API_URL

export const fetchStreamToken = async (userId) => {
    let res = await fetch(`${API_URL}/auth/get-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
    });
    const data = await res.json()
    return data;
}