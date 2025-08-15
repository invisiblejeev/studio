
'use client';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    // This layout ensures that chat pages take up the full screen height.
    return (
        <div className="h-full">
            {children}
        </div>
    );
}
