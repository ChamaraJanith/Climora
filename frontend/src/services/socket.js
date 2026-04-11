import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:5000";

const socket = io(BACKEND_URL);

export default socket;
