
'use client';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-0 md:p-0 h-full">
            {children}
        </div>
    );
}
