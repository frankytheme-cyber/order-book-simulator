import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Market Manipulation Simulator',
  description:
    'Simula e comprendi le principali tecniche di manipolazione del mercato: spoofing, pump & dump, bear raid, wash trading e layering. Strumento didattico interattivo.',
  keywords: [
    'manipolazione mercato',
    'spoofing',
    'pump and dump',
    'bear raid',
    'wash trading',
    'layering',
    'order book',
    'market manipulation',
    'trading simulator',
    'didattica finanza',
  ],
  alternates: { canonical: '/manipulation' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Market Manipulation Simulator | Order Book Simulator',
    description:
      'Impara a riconoscere le manipolazioni di mercato attraverso simulazioni interattive e spiegazioni didattiche.',
    type: 'website',
  },
};

export default function ManipulationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
