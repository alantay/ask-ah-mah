import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import Chat from "@/features/Chat";
import Inventory from "@/features/Inventory";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Image
                  src="/granny-icon.png"
                  alt="Ask Ah Mah"
                  width={45}
                  height={48}
                />
                Ask Ah Mah
              </h1>
              <p className="text-muted-foreground">
                Your friendly cooking assistant
              </p>
            </div>
            <Chat />
          </div>
          <div className="hidden lg:block lg:col-span-1">
            <Inventory />
          </div>
        </div>
      </div>
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button className="flex items-center gap-1 absolute top-8 right-4 cursor-pointer lg:hidden">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 21V22H7V21C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V4C5 3.46957 5.21071 2.96086 5.58579 2.58579C5.96086 2.21071 6.46957 2 7 2H17C17.5304 2 18.0391 2.21071 18.4142 2.58579C18.7893 2.96086 19 3.46957 19 4V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21V22H15V21H9ZM7 4V9H17V4H7ZM7 19H17V11H7V19ZM8 12H10V15H8V12ZM8 6H10V8H8V6Z"
                fill="currentColor"
              />
            </svg>
            Inventory
          </Button>
        </DrawerTrigger>
        <DrawerContent aria-label="Inventory">
          <div className="flex-1 overflow-auto p-4">
            <Inventory />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
