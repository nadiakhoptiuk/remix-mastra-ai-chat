import * as React from "react";
import { ArrowDown } from "lucide-react";
import { Button } from "~/components/ui/button";

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  smooth?: boolean;
}

const ChatMessageList = React.forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ className, children, smooth = false, ...props }, ref) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = React.useState(true);
    const [autoScrollEnabled, setAutoScrollEnabled] = React.useState(true);

    const scrollToBottom = React.useCallback((smooth?: boolean) => {
      if (scrollRef.current) {
        const scrollEl = scrollRef.current;
        scrollEl.scrollTo({
          top: scrollEl.scrollHeight,
          behavior: smooth ? "smooth" : "auto",
        });
      }
    }, []);

    React.useEffect(() => {
      if (autoScrollEnabled) {
        scrollToBottom(smooth);
      }
    }, [children, autoScrollEnabled, scrollToBottom, smooth]);

    const handleScroll = React.useCallback(() => {
      if (scrollRef.current) {
        const scrollEl = scrollRef.current;
        const isAtBottom =
          Math.abs(
            scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight
          ) < 5;
        setIsAtBottom(isAtBottom);
        setAutoScrollEnabled(isAtBottom);
      }
    }, []);

    return (
      <div className="relative w-full h-full">
        <div
          className={`flex flex-col w-full h-full p-4 overflow-y-auto ${className}`}
          ref={scrollRef}
          onScroll={handleScroll}
          {...props}
        >
          <div className="flex flex-col gap-6">{children}</div>
        </div>

        {!isAtBottom && (
          <Button
            onClick={() => {
              scrollToBottom(true);
              setAutoScrollEnabled(true);
            }}
            size="icon"
            variant="outline"
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 inline-flex rounded-full shadow-md"
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

ChatMessageList.displayName = "ChatMessageList";

export { ChatMessageList }; 