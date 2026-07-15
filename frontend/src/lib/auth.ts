import { jwtDecode } from "jwt-decode";

interface DecodedToken {
userId: string;
shopId: string;
role: "OWNER" | "STAFF";
exp: number;
}

export function getToken(): string | null {
return typeof window !== "undefined" ? localStorage.getItem("token") : null;
}

export function isAuthenticated(): boolean {
const token = getToken();
if (!token) return false;
try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.exp * 1000 > Date.now();
} catch {
    return false;
}
}