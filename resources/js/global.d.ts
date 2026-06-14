export { };

declare global {
    function route(name: string, params?: unknown): string;
    interface Window {
        Pusher: unknown;
        Echo: unknown;
    }
}

declare module 'react/jsx-runtime' {
    namespace JSX {
        interface IntrinsicElements {
            'lord-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                src?: string;
                trigger?: string;
                delay?: string;
                colors?: string;
                style?: React.CSSProperties;
            };
        }
    }
}
