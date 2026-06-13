"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

export function LandingSearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [value, setValue] = React.useState(searchParams.get("q") || "");

  // Debounce search update
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 500);

    return () => clearTimeout(timer);
  }, [value, router, pathname, searchParams]);

  return (
    <div className="relative w-full md:w-[300px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        placeholder="Cari nama ruangan..."
        className="pl-10 h-11 rounded-xl border-blue-100 bg-white/50 backdrop-blur-sm text-blue-900 focus:bg-white transition-all font-medium"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
