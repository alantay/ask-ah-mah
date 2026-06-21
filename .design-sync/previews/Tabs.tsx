import { Tabs, TabsList, TabsTrigger, TabsContent } from "ask-ah-mah";

// Tabs with a default selection — list of triggers plus the active panel.
export const Default = () => (
  <Tabs defaultValue="gather" className="w-96">
    <TabsList>
      <TabsTrigger value="gather">Gather</TabsTrigger>
      <TabsTrigger value="method">Method</TabsTrigger>
      <TabsTrigger value="notes">Notes</TabsTrigger>
    </TabsList>
    <TabsContent
      value="gather"
      className="rounded-b-xl border border-border bg-chat p-5 text-sm text-foreground"
    >
      Garlic, prawns, egg noodles, spring onion, soy and oyster sauce.
    </TabsContent>
    <TabsContent
      value="method"
      className="rounded-b-xl border border-border bg-chat p-5 text-sm text-foreground"
    >
      Bloom the aromatics, sear the prawns, toss everything with the noodles.
    </TabsContent>
    <TabsContent
      value="notes"
      className="rounded-b-xl border border-border bg-chat p-5 text-sm text-foreground"
    >
      Swap prawns for tofu to keep it vegetarian.
    </TabsContent>
  </Tabs>
);
