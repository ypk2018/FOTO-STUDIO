export interface SampleImage {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'formal-male',
    name: 'Pria Formal (Jas & Kemeja)',
    category: 'Pas Foto',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'formal-female',
    name: 'Wanita Formal (Blazer)',
    category: 'Pas Foto',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'graduation-portrait',
    name: 'Portrait Wisuda / Kasual',
    category: 'Cetak 2R - 10R',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'family-moment',
    name: 'Pemandangan / Frame Kenangan',
    category: 'Cetak 2R - 10R',
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1000&q=80',
  },
];
