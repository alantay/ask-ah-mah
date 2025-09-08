import Chat from "@/features/Chat";
import Inventory from "@/features/Inventory";

export default function Home() {
  return (
    <div>
      <div className="grid grid-cols-[minmax(900px,_1fr)_100px]">
        <main className="flex justify-center items-center">
          <Chat />
        </main>
        <aside>
          <Inventory />
        </aside>
      </div>
      <footer>All rights reserved.</footer>
    </div>
  );
}
