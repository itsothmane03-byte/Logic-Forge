// Archival pictures shown on Home and About (no faces or figures), self-hosted in public/archive
// (cropped, greyscale WebP). Each one is credited where it appears.

export interface ArchivePicture {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  credit: string;
  license: string;
  licenseUrl: string;
  source: string;
}

const CC_BY = { license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' };

export const SQUARE: ArchivePicture = {
  src: 'archive/square-of-opposition.webp',
  width: 480,
  height: 600,
  alt: 'A medieval manuscript page in Latin with a square diagram drawn in the text.',
  caption: 'The square of opposition, in a medieval copy of Peri hermeneias: which claims about every, no and some can be true together.',
  credit: 'Manuscript page, public domain; cropped',
  license: 'Public domain',
  licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
  source: 'https://commons.wikimedia.org/wiki/File:Peri_hermeneias_manuscript_showing_square_of_opposition.jpg',
};

export const FORGE: ArchivePicture = {
  src: 'archive/blacksmith-forge.webp',
  width: 480,
  height: 592,
  alt: 'Etching of a blacksmith’s forge: the hearth, bellows, hammers and tongs.',
  caption: 'A forge is a workshop where metal is heated, tested and reshaped.',
  credit: 'Etching by Bénard after Harguiniez, Wellcome Collection; cropped',
  ...CC_BY,
  source: 'https://commons.wikimedia.org/wiki/File:A_blacksmith%27s_forge;_interior_view_and_utensils_used._Etchi_Wellcome_V0023638.jpg',
};
