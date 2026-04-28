export { };

declare global {
    function route(name: string, params?: any): string;
    interface Window {
        Pusher: any;
        Echo: any;
    }
}
