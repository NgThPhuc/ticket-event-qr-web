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

    setDate(combinedDate.toISOString());
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
    <div className="flex gap-4 items-end">
      <div className="flex flex-col gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-between font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              {selectedDate ? format(selectedDate, "PPP") : "Select date"}
              <ChevronDownIcon className="h-4 w-4 opacity-50" />
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
      </div>

      <div className="flex flex-col gap-2">
        <Input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          className="w-[120px]"
        />
      </div>
    </div>
  );
}
