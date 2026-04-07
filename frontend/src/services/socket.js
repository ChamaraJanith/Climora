import { io } from "socket.io-client";

// Connect to backend URL (adjust if production URL changes later)
const socket = io("http://localhost:5000");

export default socket;
