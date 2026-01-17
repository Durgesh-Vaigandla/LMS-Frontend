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

            // HEAD request to backend (lightweight)
            await axios.head(
                import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
                { timeout: 5000 }
            );

            const latency = Date.now() - start;

            // Determine status based on latency
            let status: ConnectionStatus;
            if (latency < 100) status = "excellent";
            else if (latency < 300) status = "good";
            else if (latency < 500) status = "fair";
            else status = "poor";

            setConnection({
                status,
                latency,
                lastCheck: new Date(),
                isChecking: false,
            });
        } catch (error) {
            setConnection({
                status: "offline",
                latency: 0,
                lastCheck: new Date(),
                isChecking: false,
            });
        }
    };

    useEffect(() => {
        // Initial check
        checkConnection();

        // Check every 10 seconds
        const interval = setInterval(checkConnection, 10000);

        return () => clearInterval(interval);
    }, []);

    const getStatusConfig = () => {
        switch (connection.status) {
            case "excellent":
                return {
                    color: "bg-green-500",
                    text: "Excellent",
                    textColor: "text-green-700",
                    bgColor: "bg-green-50",
                    borderColor: "border-green-200",
                };
            case "good":
                return {
                    color: "bg-lime-500",
                    text: "Good",
                    textColor: "text-lime-700",
                    bgColor: "bg-lime-50",
                    borderColor: "border-lime-200",
                };
            case "fair":
                return {
                    color: "bg-yellow-500",
                    text: "Fair",
                    textColor: "text-yellow-700",
                    bgColor: "bg-yellow-50",
                    borderColor: "border-yellow-200",
                };
            case "poor":
                return {
                    color: "bg-orange-500",
                    text: "Poor",
                    textColor: "text-orange-700",
                    bgColor: "bg-orange-50",
                    borderColor: "border-orange-200",
                };
            case "offline":
                return {
                    color: "bg-red-500",
                    text: "Offline",
                    textColor: "text-red-700",
                    bgColor: "bg-red-50",
                    borderColor: "border-red-200",
                };
            case "checking":
                return {
                    color: "bg-gray-400",
                    text: "Checking...",
                    textColor: "text-gray-600",
                    bgColor: "bg-gray-50",
                    borderColor: "border-gray-200",
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div
            className={`${className} ${config.bgColor} ${config.borderColor} border rounded-lg shadow-md px-3 py-2 flex items-center space-x-2 transition-all duration-300`}
        >
            {/* Status Dot */}
            <div className="relative">
                <div className={`w-3 h-3 ${config.color} rounded-full`} />
                {connection.isChecking && (
                    <div className={`absolute inset-0 w-3 h-3 ${config.color} rounded-full animate-ping opacity-75`} />
                )}
            </div>

            {/* Status Text */}
            <div className="flex flex-col">
                <span className={`text-xs font-semibold ${config.textColor}`}>
                    {config.text}
                </span>
                {connection.status !== "offline" && connection.status !== "checking" && (
                    <span className="text-[10px] text-gray-500">
                        {connection.latency}ms
                    </span>
                )}
            </div>

            {/* Signal Bars Icon */}
            <div className="flex items-end space-x-0.5 h-4">
                {[1, 2, 3, 4].map((bar) => {
                    const isActive =
                        connection.status === "excellent" ||
                        (connection.status === "good" && bar <= 3) ||
                        (connection.status === "fair" && bar <= 2) ||
                        (connection.status === "poor" && bar <= 1);

                    return (
                        <div
                            key={bar}
                            className={`w-1 transition-all duration-300 ${isActive ? config.color : "bg-gray-300"
                                }`}
                            style={{ height: `${bar * 25}%` }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default ConnectivityIndicator;
