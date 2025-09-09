import Chat from "@/features/Chat";
import Inventory from "@/features/Inventory";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Ask Ah Mah</h1>
              <p className="text-muted-foreground">
                Your friendly cooking assistant
              </p>
            </div>
            <Chat />
          </div>
          <div className="lg:col-span-1">
            <Inventory />
          </div>
        </div>
      </div>
    </div>
  );
}
