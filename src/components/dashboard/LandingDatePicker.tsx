"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { id as localeId } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function LandingDatePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const dateParam = searchParams.get("date");
  const [date, setDate] = React.useState<Date | undefined>(
    dateParam ? new Date(dateParam) : new Date()
  );

  const handleSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      const params = new URLSearchParams(searchParams);
      params.set("date", format(newDate, "yyyy-MM-dd"));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full md:w-[240px] justify-start text-left font-bold rounded-xl border-blue-100 bg-white/50 backdrop-blur-sm text-blue-900 hover:bg-blue-50 hover:text-blue-900 transition-all",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
          {date ? format(date, "dd MMMM yyyy", { locale: localeId }) : <span>Pilih tanggal</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          locale={localeId}
          className="bg-white rounded-2xl"
        />
      </PopoverContent>
    </Popover>
  );
}
