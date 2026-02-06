import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";

let initialized = false;
let initPromise: Promise<void> | null = null;

// Suppress duplicate kernel registration warnings in development
if (import.meta.env.DEV) {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
        // Filter out TensorFlow kernel re-registration warnings
        const message = args[0]?.toString() || '';
        if (message.includes('kernel') && message.includes('already registered')) {
            return; // Suppress these warnings - harmless in development
        }
        originalWarn.apply(console, args);
    };
}

export async function initTF(): Promise<void> {
    if (initialized) {
        return Promise.resolve();
    }
    
    if (initPromise) {
        return initPromise;
    }
    
    initPromise = (async () => {
        try {
            console.log("Initializing TensorFlow.js...");
            
            // Try WebGL first for better performance
            const availableBackends = tf.engine().backendNames();
            console.log("Available backends:", availableBackends);
            
            let backend = "cpu";
            if (availableBackends.includes("webgl")) {
                backend = "webgl";
            }
            
            await tf.setBackend(backend);
            await tf.ready();
            
            initialized = true;
            console.log(`✅ TensorFlow.js initialized with ${backend} backend`);
            console.log(`Backend: ${tf.getBackend()}`);
        } catch (err) {
            console.error("Failed to initialize TFJS with preferred backend:", err);
            
            // Fallback to CPU
            try {
                console.log("Falling back to CPU backend...");
                await tf.setBackend("cpu");
                await tf.ready();
                initialized = true;
                console.log("✅ TensorFlow.js initialized with CPU backend");
            } catch (cpuErr) {
                console.error("❌ Failed to initialize TFJS CPU backend:", cpuErr);
                throw cpuErr;
            }
        }
    })();
    
    return initPromise;
}
