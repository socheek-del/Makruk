/** Every language any family site declares. A new site language adds a name for every game here. */
export type FamilyLanguage = 'th' | 'my' | 'en';

export type GameId = 'makruk' | 'sittuyin';

export interface FamilyGame {
  id: GameId;
  /** The game's name as a speaker of each family language would look for it. */
  names: Readonly<Record<FamilyLanguage, string>>;
}

export const GAMES: readonly FamilyGame[] = [
  {
    id: 'makruk',
    names: { th: 'หมากรุกไทย', my: 'ထိုင်းစစ်တုရင်', en: 'Makruk (Thai chess)' },
  },
  {
    id: 'sittuyin',
    names: { th: 'หมากรุกพม่า', my: 'စစ်တုရင်', en: 'Sittuyin (Burmese chess)' },
  },
];
