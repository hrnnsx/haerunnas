import Butterflies from "@/lib/components/Butterflies";

export default function Home() {
  return (
    <main>
      <Butterflies theme="dark" white={1} butterflyOpacity={1} density={0.4} />
    </main>
  );
}