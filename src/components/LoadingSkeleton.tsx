export default function LoadingSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-3 animate-pulse" aria-label="Loading content">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="bg-white rounded-2xl p-4 border border-slate-100"
                >
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-slate-200 rounded-lg" />
                            <div className="h-3 w-20 bg-slate-100 rounded-lg" />
                        </div>
                        <div className="flex gap-2">
                            {Array.from({ length: 4 }).map((_, j) => (
                                <div key={j} className="h-9 w-14 bg-slate-100 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
