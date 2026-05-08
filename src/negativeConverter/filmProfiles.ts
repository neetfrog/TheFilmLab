import { ProcessingParams } from './imageProcessor';

export interface FilmProfile {
  name: string;
  category: 'Kodak' | 'Fujifilm' | 'Agfa' | 'Ilford';
  params: Partial<ProcessingParams>;
}

export const FILM_PROFILES: FilmProfile[] = [
  // Kodak Color Negative
  {
    name: 'Kodak Gold 200',
    category: 'Kodak',
    params: {
      filmType: 'color',
      temperature: -15,
      tint: 5,
      saturation: 20,
      vibrance: 15,
      contrast: 10,
    },
  },
  {
    name: 'Kodak Portra 400',
    category: 'Kodak',
    params: {
      filmType: 'color',
      temperature: -10,
      tint: -8,
      saturation: 8,
      vibrance: 25,
      contrast: 5,
      shadows: 10,
    },
  },
  {
    name: 'Kodak Portra 800',
    category: 'Kodak',
    params: {
      filmType: 'color',
      temperature: -5,
      tint: -5,
      saturation: 12,
      vibrance: 20,
      contrast: 8,
      grainAmount: 15,
    },
  },
  {
    name: 'Kodak Ektar 100',
    category: 'Kodak',
    params: {
      filmType: 'color',
      temperature: 5,
      tint: 8,
      saturation: 35,
      vibrance: 10,
      contrast: 15,
      highlights: 5,
    },
  },
  {
    name: 'Kodak Vision3',
    category: 'Kodak',
    params: {
      filmType: 'color',
      temperature: -20,
      tint: 12,
      saturation: 15,
      vibrance: 20,
      contrast: 12,
      grainAmount: 18,
    },
  },

  // Fujifilm Color Negative
  {
    name: 'Fujifilm Superia 200',
    category: 'Fujifilm',
    params: {
      filmType: 'color',
      temperature: 8,
      tint: -5,
      saturation: 15,
      vibrance: 18,
      contrast: 12,
    },
  },
  {
    name: 'Fujifilm Superia 400',
    category: 'Fujifilm',
    params: {
      filmType: 'color',
      temperature: 10,
      tint: -3,
      saturation: 18,
      vibrance: 22,
      contrast: 14,
      grainAmount: 10,
    },
  },
  {
    name: 'Fujifilm Pro 400H',
    category: 'Fujifilm',
    params: {
      filmType: 'color',
      temperature: 12,
      tint: -8,
      saturation: 12,
      vibrance: 25,
      contrast: 8,
    },
  },
  {
    name: 'Fujifilm Velvia 50',
    category: 'Fujifilm',
    params: {
      filmType: 'color',
      temperature: -8,
      tint: 15,
      saturation: 40,
      vibrance: 15,
      contrast: 20,
      highlights: -10,
    },
  },

  // Agfa Color Negative
  {
    name: 'Agfa Vista 200',
    category: 'Agfa',
    params: {
      filmType: 'color',
      temperature: -8,
      tint: 10,
      saturation: 25,
      vibrance: 20,
      contrast: 11,
    },
  },
  {
    name: 'Agfa Ultra 50',
    category: 'Agfa',
    params: {
      filmType: 'color',
      temperature: -5,
      tint: 12,
      saturation: 30,
      vibrance: 12,
      contrast: 16,
    },
  },

  // Black & White
  {
    name: 'Ilford HP5 Plus',
    category: 'Ilford',
    params: {
      filmType: 'bw',
      contrast: 15,
      highlights: 8,
      shadows: 5,
      sharpening: 15,
    },
  },
  {
    name: 'Ilford FP4 Plus',
    category: 'Ilford',
    params: {
      filmType: 'bw',
      contrast: 10,
      highlights: 5,
      shadows: 8,
      sharpening: 12,
    },
  },
  {
    name: 'Kodak Tri-X 400',
    category: 'Kodak',
    params: {
      filmType: 'bw',
      contrast: 18,
      highlights: 10,
      shadows: 3,
      grainAmount: 20,
      sharpening: 18,
    },
  },
  {
    name: 'Kodak Portra BW',
    category: 'Kodak',
    params: {
      filmType: 'bw',
      contrast: 12,
      highlights: 8,
      shadows: 10,
      sharpening: 10,
    },
  },
];

export const getProfilesByCategory = (
  category: FilmProfile['category']
): FilmProfile[] => {
  return FILM_PROFILES.filter((p) => p.category === category);
};

export const getCategories = (): FilmProfile['category'][] => {
  const cats = new Set<FilmProfile['category']>();
  FILM_PROFILES.forEach((p) => cats.add(p.category));
  return Array.from(cats);
};
