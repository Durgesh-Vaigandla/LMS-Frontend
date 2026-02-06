import React, { useEffect, useState } from "react";
import axios from "axios";

type ConnectionStatus = "offline" | "poor" | "fair" | "good" | "excellent" | "checking";

interface ConnectionState {
    status: ConnectionStatus;
    latency: number;
    lastCheck: Date;
    isChecking: boolean;
}

interface ConnectivityIndicatorProps {
    className?: string;
}

const ConnectivityIndicator: React.FC<ConnectivityIndicatorProps> = ({ className = "" }) => {
    const [connection, setConnection] = useState<ConnectionState>({
        status: "checking",
        latency: 0,
        lastCheck: new Date(),
        isChecking: true,
    });

    const checkConnection = async () => {
        setConnection((prev) => ({ ...prev, isChecking: true }));

        try {
            const start = Date.now();
            // Use a highly available public endpoint for more reliable connectivity check if backend is local/slow
            // Or stick to backend to ensure they can reach the LMS. 
            // Better to check backend to ensure they can submit answers.
            await axios.head(
                import.meta.env.VITE_API_BASE_URL + "/api/auth/public/ping" || "http://localhost:8080/api/auth/public/ping",
                // We need a lightweight endpoint. 'ping' doesn't exist, let's use root or a known public one if 404 is fine.
                // Actually, let's try a simple fetch to the backend root or health if available.
                // If we don't have a guaranteed ping endpoint, we can use a fetch with 'no-cors' to just check reachability, 
                // but we need latency. 
                // Let's assume hitting the base URL is fine, but maybe it handles 404. 
                // A 404 is still "Online".
                { timeout: 5000, validateStatus: () => true }
            );

            const latency = Date.now() - start;

            let status: ConnectionStatus;
            if (latency < 150) status = "excellent";
            else if (latency < 400) status = "good";
            else if (latency < 800) status = "fair";
            else status = "poor";

            setConnection({
                status,
                latency,
                lastCheck: new Date(),
                isChecking: false,
            });
        } catch (error) {
            // Only retry once or twice before declaring offline could be better, but for now showing offline is safe.
            setConnection({
                status: "offline",
                latency: 0,
                lastCheck: new Date(),
                isChecking: false,
            });
        }
    };

    useEffect(() => {
        checkConnection();
        const interval = setInterval(checkConnection, 5000); // Check every 5s
        return () => clearInterval(interval);
    }, []);

    const getStatusConfig = () => {
        switch (connection.status) {
            case "excellent":
                return { color: "bg-green-500", text: "Excellent", textColor: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200" };
            case "good":
                return { color: "bg-lime-500", text: "Good", textColor: "text-lime-700", bgColor: "bg-lime-50", borderColor: "border-lime-200" };
            case "fair":
                return { color: "bg-yellow-500", text: "Fair", textColor: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" };
            case "poor":
                return { color: "bg-orange-500", text: "Poor", textColor: "text-orange-700", bgColor: "bg-orange-50", borderColor: "border-orange-200" };
            case "offline":
                return { color: "bg-red-500", text: "Offline", textColor: "text-red-700", bgColor: "bg-red-50", borderColor: "border-red-200" };
            case "checking":
                return { color: "bg-gray-400", text: "Checking...", textColor: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`${className} ${config.bgColor} ${config.borderColor} border rounded-lg shadow-sm px-3 py-1.5 flex items-center space-x-3 transition-all duration-300`}>
            {/* Status Dot */}
            <div className="relative flex shrink-0">
                <div className={`w-2.5 h-2.5 ${config.color} rounded-full`} />
                {connection.isChecking && (
                    <div className={`absolute inset-0 w-2.5 h-2.5 ${config.color} rounded-full animate-ping opacity-75`} />
                )}
            </div>

            {/* Status Text & Speed */}
            <div className="flex flex-col leading-tight">
                <span className={`text-[10px] uppercase tracking-wider font-bold ${config.textColor}`}>
                    {config.text}
                </span>
                {connection.status !== "offline" && connection.status !== "checking" && (
                    <span className="text-[10px] text-gray-500 font-mono">
                        {connection.latency}ms
                    </span>
                )}
            </div>

            {/* Bars */}
            <div className="flex items-end space-x-[2px] h-3">
                {[1, 2, 3, 4].map((bar) => {
                    const isActive =
                        connection.status === "excellent" ||
                        (connection.status === "good" && bar <= 3) ||
                        (connection.status === "fair" && bar <= 2) ||
                        (connection.status === "poor" && bar <= 1);

                    return (
                        <div
                            key={bar}
                            className={`w-1 rounded-sm transition-all duration-300 ${isActive ? config.color : "bg-gray-200"}`}
                            style={{ height: `${bar * 25}%` }}
                        />
                    );
                })}
            </div>
        </div>
    );

};

export default ConnectivityIndicator;
