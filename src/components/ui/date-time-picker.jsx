import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

export function DateTimePicker({ date, setDate, label }) {
  const [open, setOpen] = React.useState(false);

  // Parse initial state from props
  const initialDate = date ? new Date(date) : undefined;
  const initialTime = date ? format(new Date(date), "HH:mm") : "09:00";

  const [selectedDate, setSelectedDate] = React.useState(initialDate);
  const [timeValue, setTimeValue] = React.useState(initialTime);

  // Sync with props if they change externally
  React.useEffect(() => {
    if (date) {
      const d = new Date(date);
      setSelectedDate(d);
      setTimeValue(format(d, "HH:mm"));
    }
  }, [date]);

  const updateParent = (newDate, newTime) => {
    if (!newDate || !newTime) return;

    const [hours, minutes] = newTime.split(":").map(Number);
    const combinedDate = new Date(newDate);
    combinedDate.setHours(hours);
    combinedDate.setMinutes(minutes);

    // Return datetime-local format (YYYY-MM-DDTHH:mm) instead of ISO UTC
    const year = combinedDate.getFullYear();
    const month = String(combinedDate.getMonth() + 1).padStart(2, '0');
    const day = String(combinedDate.getDate()).padStart(2, '0');
    const hoursStr = String(combinedDate.getHours()).padStart(2, '0');
    const minutesStr = String(combinedDate.getMinutes()).padStart(2, '0');
    
    setDate(`${year}-${month}-${day}T${hoursStr}:${minutesStr}`);
  };

  const handleDateSelect = (newDate) => {
    setSelectedDate(newDate);
    setOpen(false);
    if (newDate) {
      updateParent(newDate, timeValue);
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    if (selectedDate) {
      updateParent(selectedDate, newTime);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "flex-1 justify-between font-normal min-w-0",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {selectedDate ? format(selectedDate, "PPP") : "Select date"}
            </span>
            <ChevronDownIcon className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            captionLayout="dropdown"
            fromYear={2024}
            toYear={2030}
          />
        </PopoverContent>
      </Popover>

      <Input
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
        className="w-[110px] flex-shrink-0"
      />
    </div>
  );
}
