export class MediaStreamManager {
    private static instance: MediaStreamManager;
    private activeStream: MediaStream | null = null;

    private constructor() { }

    public static getInstance(): MediaStreamManager {
        if (!MediaStreamManager.instance) {
            MediaStreamManager.instance = new MediaStreamManager();
        }
        return MediaStreamManager.instance;
    }

    public setStream(stream: MediaStream) {
        // If there's an existing stream distinct from the new one, stop it to prevent leaks
        if (this.activeStream && this.activeStream.id !== stream.id) {
            this.activeStream.getTracks().forEach(track => track.stop());
        }
        this.activeStream = stream;
    }

    public getStream(): MediaStream | null {
        return this.activeStream;
    }

    public clearStream() {
        if (this.activeStream) {
            //   this.activeStream.getTracks().forEach(track => track.stop());
            // Don't auto-stop here? Or do strict cleanup?
            // Usually if we clear, we want to stop.
            // But if we are "transferring" ownership, maybe we shouldn't stop?
            // For now, let's assume clearStream() is called when we want to Destroy it.
            // If we just want to "consume" it, we getStream().
        }
        this.activeStream = null;
    }

    public stopStream() {
        if (this.activeStream) {
            this.activeStream.getTracks().forEach(track => track.stop());
            this.activeStream = null;
        }
    }
}
