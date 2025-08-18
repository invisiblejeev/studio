
'use client';

// This layout file is no longer necessary with the new Sidebar-based layout,
// as the main app layout now handles the container styling.
// We keep it to return the children directly.
export default function ChatLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
