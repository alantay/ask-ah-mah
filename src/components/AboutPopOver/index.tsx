"use client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface InfoPopoverProps {
  className?: string;
  svgSize?: string;
  popoverAlign?: "center" | "end";
}

export default function AboutPopOver({
  className,
  svgSize = "24",
  popoverAlign = "end",
}: InfoPopoverProps) {
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("lun.tay.work@gmail.com");
      toast.success("Email copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy email", err);
      toast.error("Failed to copy email");
    }
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={`cursor-pointer ${className || ""}`}
          aria-label="About Ask Ah Mah"
        >
          <svg
            width={svgSize}
            height={svgSize}
            viewBox="0 0 24 24"
            className="text-tertiary"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2ZM12 4C9.87827 4 7.84344 4.84285 6.34315 6.34315C4.84285 7.84344 4 9.87827 4 12C4 14.1217 4.84285 16.1566 6.34315 17.6569C7.84344 19.1571 9.87827 20 12 20C14.1217 20 16.1566 19.1571 17.6569 17.6569C19.1571 16.1566 20 14.1217 20 12C20 9.87827 19.1571 7.84344 17.6569 6.34315C16.1566 4.84285 14.1217 4 12 4ZM12 16C12.2652 16 12.5196 16.1054 12.7071 16.2929C12.8946 16.4804 13 16.7348 13 17C13 17.2652 12.8946 17.5196 12.7071 17.7071C12.5196 17.8946 12.2652 18 12 18C11.7348 18 11.4804 17.8946 11.2929 17.7071C11.1054 17.5196 11 17.2652 11 17C11 16.7348 11.1054 16.4804 11.2929 16.2929C11.4804 16.1054 11.7348 16 12 16ZM12 6.5C12.8423 6.50003 13.6583 6.79335 14.3078 7.3296C14.9573 7.86585 15.3998 8.61154 15.5593 9.43858C15.7188 10.2656 15.5853 11.1224 15.1818 11.8617C14.7783 12.601 14.1299 13.1768 13.348 13.49C13.2322 13.5326 13.1278 13.6014 13.043 13.691C12.999 13.741 12.992 13.805 12.993 13.871L13 14C12.9997 14.2549 12.9021 14.5 12.7272 14.6854C12.5522 14.8707 12.313 14.9822 12.0586 14.9972C11.8042 15.0121 11.5536 14.9293 11.3582 14.7657C11.1627 14.6021 11.0371 14.3701 11.007 14.117L11 14V13.75C11 12.597 11.93 11.905 12.604 11.634C12.8783 11.5245 13.1176 11.3423 13.2962 11.107C13.4748 10.8717 13.5859 10.5922 13.6176 10.2986C13.6493 10.0049 13.6004 9.70813 13.4762 9.44014C13.352 9.17215 13.1571 8.94307 12.9125 8.77748C12.6679 8.61189 12.3829 8.51606 12.0879 8.50027C11.793 8.48448 11.4993 8.54934 11.2384 8.68787C10.9775 8.8264 10.7593 9.03338 10.6072 9.28658C10.4551 9.53978 10.3748 9.82962 10.375 10.125C10.375 10.3902 10.2696 10.6446 10.0821 10.8321C9.89457 11.0196 9.64022 11.125 9.375 11.125C9.10978 11.125 8.85543 11.0196 8.66789 10.8321C8.48036 10.6446 8.375 10.3902 8.375 10.125C8.375 9.16359 8.75692 8.24156 9.43674 7.56174C10.1166 6.88192 11.0386 6.5 12 6.5Z"
              fill="currentColor"
            />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align={popoverAlign}
        className="w-[600px] max-w-[95vw]"
      >
        <div className="space-y-2">
          <h4 className="font-medium leading-none">About Ask Ah Mah</h4>
          <div className="text-sm">
            <p>
              {`A passion project inspired by my own cooking journey. I loved
              using AI for cooking help, but it kept forgetting my ingredients!
              So I built Ask Ah Mah with persistent memory and a caring
              personality.`}
            </p>
            <p className="mt-4">
              {`But this app is about more than just fixing a technical problem -
              it's about making cooking feel approachable, where you understand
              your ingredients, learn the "why" behind each step, and cook with
              love! From Maillard reactions to knife techniques, Ah Mah explains
              the science so you truly understand what you're doing.`}
            </p>

            <h3 className="mt-4">{`I'd love your feedback!`}</h3>
            <p>
              <Button
                variant="ghost"
                onClick={copyEmail}
                className=" cursor-pointer"
                size="icon"
                aria-label="Copy email address"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
                    fill="var(--primary)"
                  />
                </svg>
              </Button>
              <Button
                asChild
                variant="ghost"
                className="cursor-pointer"
                size="icon"
              >
                <a
                  href="https://www.linkedin.com/in/tay-alan/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn profile"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19 3C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19ZM18.5 18.5V13.2C18.5 12.3354 18.1565 11.5062 17.5452 10.8948C16.9338 10.2835 16.1046 9.94 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17C14.6813 12.17 15.0374 12.3175 15.2999 12.5801C15.5625 12.8426 15.71 13.1987 15.71 13.57V18.5H18.5ZM6.88 8.56C7.32556 8.56 7.75288 8.383 8.06794 8.06794C8.383 7.75288 8.56 7.32556 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19C6.43178 5.19 6.00193 5.36805 5.68499 5.68499C5.36805 6.00193 5.19 6.43178 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56ZM8.27 18.5V10.13H5.5V18.5H8.27Z"
                      fill="var(--primary)"
                    />
                  </svg>
                </a>
              </Button>
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
