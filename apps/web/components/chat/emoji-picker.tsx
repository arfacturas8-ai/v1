"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";

// Dynamic import for emoji-mart to avoid SSR issues
const Picker = React.lazy(() =>
  import("@emoji-mart/react").then((mod) => ({ default: mod.Picker }))
);

interface EmojiData {
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  shortcodes: string;
}

interface EmojiPickerProps {
  onEmojiSelect?: (emoji: EmojiData) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function EmojiPicker({ 
  onEmojiSelect, 
  disabled = false, 
  className,
  children 
}: EmojiPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleEmojiSelect = (emoji: EmojiData) => {
    onEmojiSelect?.(emoji);
    setOpen(false);
  };

  if (!mounted) {
    return children || (
      <Button
        variant="ghost"
        size="icon-sm"
        className={cn("w-8 h-8 text-gray-400 hover:text-white", className)}
        disabled={disabled}
        aria-label="Add emoji"
      >
        <Smile className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn("w-8 h-8 text-gray-400 hover:text-white", className)}
            disabled={disabled}
            aria-label="Add emoji"
          >
            <Smile className="w-4 h-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 border-gray-600 bg-gray-800" 
        side="top" 
        align="end"
        sideOffset={8}
      >
        <React.Suspense 
          fallback={
            <div className="w-80 h-80 flex items-center justify-center bg-gray-800">
              <div className="text-gray-400">Loading emojis...</div>
            </div>
          }
        >
          <Picker
            data={async () => {
              const response = await import("@emoji-mart/data");
              return response.default;
            }}
            onEmojiSelect={handleEmojiSelect}
            theme="dark"
            set="native"
            searchPosition="top"
            previewPosition="none"
            skinTonePosition="search"
            maxFrequentRows={2}
            perLine={8}
            categories={[
              'frequent',
              'people', 
              'nature', 
              'foods', 
              'activity', 
              'places', 
              'objects', 
              'symbols',
              'flags'
            ]}
            style={{
              width: '352px',
              height: '435px',
              backgroundColor: '#374151',
              borderColor: '#4b5563',
            }}
            locale="en"
            searchProps={{
              placeholder: 'Search emojis...',
              style: {
                backgroundColor: '#4b5563',
                borderColor: '#6b7280',
                color: '#f9fafb'
              }
            }}
          />
        </React.Suspense>
      </PopoverContent>
    </Popover>
  );
}

// Utility function to convert emoji to text
export function emojiToText(emoji: EmojiData): string {
  return emoji.native || emoji.shortcodes || `:${emoji.id}:`;
}

// Hook for frequently used emojis
export function useFrequentEmojis() {
  const [frequentEmojis, setFrequentEmojis] = React.useState<EmojiData[]>([]);

  React.useEffect(() => {
    const stored = localStorage.getItem('frequent-emojis');
    if (stored) {
      try {
        setFrequentEmojis(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load frequent emojis:', error);
      }
    }
  }, []);

  const addFrequentEmoji = React.useCallback((emoji: EmojiData) => {
    setFrequentEmojis(prev => {
      const filtered = prev.filter(e => e.id !== emoji.id);
      const updated = [emoji, ...filtered].slice(0, 24); // Keep top 24
      localStorage.setItem('frequent-emojis', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { frequentEmojis, addFrequentEmoji };
}