import type { Lesson, Unit } from './types';

/**
 * Sittuyin lessons. Every position here is checked against the engine in `lessons.test.ts`: each FEN
 * must parse, each move solution must be legal, each `targetsOf` answer must equal the engine's own
 * legal destinations, and each counting claim must match `counting()`. So the text below can never
 * drift away from the rules in `packages/sittuyin/RULES.md`.
 */

const START = '8/8/4pppp/pppp4/4PPPP/PPPP4/8/8[KSSFRRNNkssfrrnn] w - - 0 1';

/** Squares the eight Ne of each side occupy at the start. */
const WHITE_NE = ['a3', 'b3', 'c3', 'd3', 'e4', 'f4', 'g4', 'h4'];

/** White's promotion squares: the long diagonals in Black's half. */
const WHITE_DIAGONAL = ['a8', 'b7', 'c6', 'd5', 'e5', 'f6', 'g7', 'h8'];

/** Every Yahhta placement in the setup phase; a Yahhta may only stand on its own back rank. */
const YAHHTA_PLACEMENTS = ['R@a1', 'R@b1', 'R@c1', 'R@d1', 'R@e1', 'R@f1', 'R@g1', 'R@h1'];

const NO = { my: 'မရပါ', en: 'No' };
const YES = { my: 'ရပါသည်', en: 'Yes' };

const board: Lesson = {
  id: 'board',
  icon: 'board',
  title: { my: 'ကစားကွက်ကို သိပါ', en: 'Meet the board' },
  summary: { my: 'ကစားကွက်နှင့် အစပြု အနေအထား', en: 'The board and the starting position' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: START,
      text: {
        my: 'ဤသည်မှာ စစ်တုရင် ကစားကွက်ဖြစ်သည်။ အကွက် ၈×၈ ရှိပြီး အကွက်အားလုံး အရောင်တူသည်။ အဖြူသည် အောက်ဘက်၊ အမည်းသည် အပေါ်ဘက်တွင် ရှိသည်။',
        en: 'This is the Sittuyin board: 8×8 squares, all the same colour. White sits at the bottom, Black at the top.',
      },
    },
    {
      kind: 'info',
      fen: START,
      highlight: WHITE_NE,
      text: {
        my: 'ပွဲစတင်ချိန်တွင် နေများသာ ကစားကွက်ပေါ်ရှိသည်။ နေရှစ်ခုသည် လှေကားထစ်ပုံစံဖြင့် တန်းစီနေသည် — အဖြူဘက်တွင် a3 မှ d3 နှင့် e4 မှ h4 အထိ။',
        en: 'Only the Ne (pawns) start on the board. The eight of them stand in a staircase — for White, a3 to d3 and e4 to h4.',
      },
    },
    {
      kind: 'squares',
      fen: START,
      answer: ['e4', 'f4', 'g4', 'h4'],
      text: { my: 'စတုတ္ထတန်းပေါ်ရှိ အဖြူနေ လေးခုကို တို့ပါ။', en: "Tap the four White Ne that stand on the fourth rank." },
      hint: {
        my: 'လှေကားထစ်၏ အမြင့်ပိုင်းဖြစ်သည် — ကစားကွက်၏ ညာဘက်ခြမ်း။',
        en: 'They are the upper half of the staircase, on the right-hand side of the board.',
      },
    },
    {
      kind: 'quiz',
      fen: START,
      text: { my: 'ပွဲစချိန်တွင် ကျန်အမဲ ၁၆ ခုသည် ဘယ်နေရာတွင် ရှိသနည်း။', en: 'Where are the other 16 pieces when the game begins?' },
      choices: [
        { my: 'နောက်တန်းပေါ်တွင် အဆင်သင့် ရှိနေသည်', en: 'Already set up on the back ranks' },
        { my: 'ကစားသူ၏ လက်ထဲတွင် — ကိုယ်တိုင် ချထားရမည်', en: "In the players' hands — you place them yourself" },
        { my: 'ပွဲတွင် လုံးဝ မပါဝင်ပါ', en: 'They are not used in the game at all' },
      ],
      correct: 1,
      hint: {
        my: 'စစ်တုရင်တွင် ကိုယ်ပိုင် တပ်စီစဉ်ခြင်းသည် ပွဲ၏ အစိတ်အပိုင်း တစ်ခုဖြစ်သည်။',
        en: 'In Sittuyin, arranging your own army is part of the game.',
      },
    },
  ],
};

const setup: Lesson = {
  id: 'setup',
  icon: 'setup',
  title: { my: 'တပ်စီစဉ်ခြင်း', en: 'Setting up your army' },
  summary: { my: 'အမဲများကို ကိုယ်တိုင် ချထားခြင်း', en: 'Placing your own pieces' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: START,
      text: {
        my: 'ပွဲ၏ ပထမပိုင်းတွင် နှစ်ဖက်စလုံးသည် အလှည့်ကျ အမဲတစ်ခုစီ ချထားသည်။ အဖြူက အရင်စသည်။ တစ်ဖက်လျှင် အမဲ ရှစ်ခု — မင်းကြီး၊ စစ်ကဲ၊ ဆင်နှစ်ခု၊ မြင်းနှစ်ခု၊ ရထားနှစ်ခု။',
        en: 'The game opens with a setup phase: the two sides take turns placing one piece each, White first. Each side places eight pieces — Min-gyi, Sit-ke, two Sin, two Myin and two Yahhta.',
      },
    },
    {
      kind: 'info',
      fen: START,
      highlight: ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'],
      text: {
        my: 'အမဲတစ်ခုသည် မိမိဘက်၏ တန်းသုံးတန်းအတွင်း ဗလာအကွက်ပေါ်တွင်သာ ရပ်နိုင်သည်။ ရထားမူကား ခြွင်းချက် — မိမိ၏ နောက်ဆုံးတန်းပေါ်တွင်သာ ရပ်ရသည်။',
        en: "A piece goes on any empty square of your own three ranks. The Yahhta is the exception: it may only stand on your own back rank.",
      },
    },
    {
      kind: 'move',
      fen: START,
      solutions: YAHHTA_PLACEMENTS,
      text: { my: 'ရထားတစ်ခုကို ချပါ။', en: 'Place one of your Yahhta.' },
      hint: {
        my: 'လက်ထဲမှ ရထားကို ရွေးပြီး ပထမတန်း (a1 မှ h1) ပေါ်ရှိ အကွက်တစ်ခုကို ရွေးပါ။',
        en: 'Pick the Yahhta from your tray, then choose a square on the first rank, a1 to h1.',
      },
      success: {
        my: 'မှန်ပါသည်။ ရထားနှစ်ခုစလုံး နောက်ဆုံးတန်းပေါ်တွင်သာ ရပ်ရသည်။',
        en: 'Right — both Yahhta must stand on your back rank.',
      },
    },
    {
      kind: 'quiz',
      fen: START,
      text: {
        my: 'မိမိ၏ မင်းကြီးကို ရှင်တိုက်ခံရစေမည့် နေရာတွင် အမဲချ၍ ရပါသလား။',
        en: 'May you place a piece so that your own Min-gyi is left in check?',
      },
      choices: [NO, YES],
      correct: 0,
      hint: {
        my: 'အမဲချခြင်းသည်လည်း ရွှေ့ကွက်တစ်ခုဖြစ်သည် — မိမိမင်းကြီးကို ရှင်တိုက်ခံရအောင် မလုပ်ရ။ သို့သော် ပြိုင်ဘက်ကိုမူ ရှင်တိုက်၍ ရသည်။',
        en: 'A placement is a move like any other: it may never leave your own Min-gyi in check. It may give check to the opponent, though.',
      },
    },
  ],
};

const ne: Lesson = {
  id: 'ne',
  icon: 'p',
  title: { my: 'နေ', en: 'The Ne' },
  summary: { my: 'တစ်ကွက်စီ ရှေ့တိုး၊ ထောင့်ဖြတ် ဖမ်းယူ', en: 'One step forward, captures on the diagonal' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/8/8/2p1p3/3P4/8/1P6/K7[] w - - 0 20',
      text: {
        my: 'နေသည် ရှေ့သို့ တစ်ကွက်တိုးသည်။ နောက်ပြန် မရွှေ့နိုင်ပါ။ ပထမရွှေ့ကွက်တွင်ပင် နှစ်ကွက် မတိုးနိုင်ပါ။',
        en: 'The Ne moves one step straight forward. It never moves backward, and it has no double first step.',
      },
    },
    {
      kind: 'squares',
      fen: '7k/8/8/2p1p3/3P4/8/1P6/K7[] w - - 0 20',
      targetsOf: 'd4',
      answer: ['c5', 'd5', 'e5'],
      text: { my: 'd4 ရှိ နေ ရောက်နိုင်သော အကွက်အားလုံးကို တို့ပါ။', en: 'Tap every square the Ne on d4 can reach.' },
      hint: {
        my: 'ရှေ့သို့ တစ်ကွက်၊ ထို့အပြင် ပြိုင်ဘက်အမဲရှိသော ထောင့်ဖြတ် အကွက်နှစ်ခု။',
        en: 'One square straight ahead, plus the two diagonal squares where an enemy piece stands.',
      },
    },
    {
      kind: 'move',
      fen: '7k/8/8/2p1p3/3P4/8/1P6/K7[] w - - 0 20',
      solutions: ['d4c5', 'd4e5'],
      text: { my: 'အမည်းနေ တစ်ခုကို ဖမ်းပါ။', en: 'Capture one of the Black Ne.' },
      hint: { my: 'နေသည် ထောင့်ဖြတ်ဖြင့်သာ ဖမ်းသည်၊ ရှေ့တည့်တည့်မှ မဖမ်းနိုင်ပါ။', en: 'A Ne captures diagonally, never straight ahead.' },
      success: { my: 'နေသည် ရွှေ့ပုံနှင့် ဖမ်းပုံ မတူပါ။', en: 'A Ne moves one way and captures another.' },
    },
    {
      kind: 'quiz',
      fen: '7k/8/8/2p1p3/3P4/8/1P6/K7[] w - - 0 20',
      text: { my: 'ရှေ့တည့်တည့်ရှိ ပြိုင်ဘက်အမဲကို နေက ဖမ်း၍ ရပါသလား။', en: 'Can a Ne capture the piece directly in front of it?' },
      choices: [NO, YES],
      correct: 0,
      hint: { my: 'ရှေ့တည့်တည့်တွင် အမဲရှိလျှင် နေသည် ပိတ်မိနေသည်။', en: 'A piece straight ahead simply blocks the Ne.' },
    },
  ],
};

const yahhta: Lesson = {
  id: 'yahhta',
  icon: 'r',
  title: { my: 'ရထား', en: 'The Yahhta' },
  summary: { my: 'တန်းလိုက်၊ တိုင်လိုက် အဝေးရွှေ့', en: 'Along ranks and files, any distance' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/8/3p4/8/1P1R4/8/3P4/7K[] w - - 0 20',
      text: {
        my: 'ရထားသည် တန်းလိုက် သို့မဟုတ် တိုင်လိုက် အကွက်မည်မျှမဆို ရွှေ့နိုင်သည်။ အမဲတစ်ခုကို ကျော်၍မရ။ အားအကောင်းဆုံး အမဲဖြစ်သည်။',
        en: 'The Yahhta slides any number of squares along a rank or a file. It cannot jump over a piece. It is the strongest piece in the game.',
      },
    },
    {
      kind: 'squares',
      fen: '7k/8/3p4/8/1P1R4/8/3P4/7K[] w - - 0 20',
      targetsOf: 'd4',
      answer: ['c4', 'd3', 'd5', 'd6', 'e4', 'f4', 'g4', 'h4'],
      text: { my: 'd4 ရှိ ရထား ရောက်နိုင်သော အကွက်အားလုံးကို တို့ပါ။', en: 'Tap every square the Yahhta on d4 can reach.' },
      hint: {
        my: 'မိမိဘက် အမဲရှိလျှင် ထိုအကွက်မတိုင်မီ ရပ်ရသည်။ ပြိုင်ဘက်အမဲရှိလျှင် ထိုအကွက်ကို ဖမ်းပြီး ရပ်သည်။',
        en: 'It stops before one of your own pieces, and stops on an enemy piece by capturing it.',
      },
    },
    {
      kind: 'move',
      fen: '7k/8/3p4/8/1P1R4/8/3P4/7K[] w - - 0 20',
      solutions: ['d4d6'],
      text: { my: 'ရထားဖြင့် အမည်းနေကို ဖမ်းပါ။', en: 'Capture the Black Ne with your Yahhta.' },
      hint: { my: 'd တိုင်အတိုင်း အပေါ်သို့ ကြည့်ပါ။', en: 'Look up the d-file.' },
    },
    {
      kind: 'quiz',
      fen: '7k/8/3p4/8/1P1R4/8/3P4/7K[] w - - 0 20',
      text: { my: 'ရထားသည် အမဲတစ်ခုကို ကျော်၍ ရွှေ့နိုင်ပါသလား။', en: 'Can a Yahhta jump over a piece?' },
      choices: [NO, YES],
      correct: 0,
      hint: { my: 'မြင်းတစ်ကောင်တည်းသာ ကျော်နိုင်သည်။', en: 'Only the Myin jumps.' },
    },
  ],
};

const myin: Lesson = {
  id: 'myin',
  icon: 'n',
  title: { my: 'မြင်း', en: 'The Myin' },
  summary: { my: 'L ပုံစံ ခုန်ကျော်', en: 'The L-shaped jump' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/7p/8/8/3N4/8/1P6/K7[] w - - 0 20',
      text: {
        my: 'မြင်းသည် တစ်ဘက်သို့ နှစ်ကွက်၊ ထို့နောက် ဘေးသို့ တစ်ကွက် — L ပုံစံ ရွှေ့သည်။ ကြားထဲရှိ အမဲများကို ကျော်နိုင်သော တစ်ခုတည်းသော အမဲဖြစ်သည်။',
        en: 'The Myin moves two squares one way and one square across — an L. It is the only piece that jumps over whatever is in between.',
      },
    },
    {
      kind: 'squares',
      fen: '7k/7p/8/8/3N4/8/1P6/K7[] w - - 0 20',
      targetsOf: 'd4',
      answer: ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5'],
      text: { my: 'd4 ရှိ မြင်း ရောက်နိုင်သော အကွက်အားလုံးကို တို့ပါ။', en: 'Tap every square the Myin on d4 can reach.' },
      hint: { my: 'ကစားကွက်အလယ်တွင် ရှစ်ကွက် ရှိသည်။', en: 'From the middle of the board there are eight of them.' },
    },
    {
      kind: 'move',
      fen: '7k/7p/8/8/3N4/8/1P6/K7[] w - - 0 20',
      solutions: ['d4c6', 'd4e6'],
      text: { my: 'မြင်းကို ဆဋ္ဌမတန်းသို့ ရွှေ့ပါ။', en: 'Move the Myin to the sixth rank.' },
      hint: { my: 'အပေါ်သို့ နှစ်တန်း တက်သော ရွှေ့ကွက် နှစ်ခု ရှိသည်။', en: 'Two of its jumps go two ranks up.' },
    },
    {
      kind: 'quiz',
      fen: '7k/7p/8/8/3N4/8/1P6/K7[] w - - 0 20',
      text: { my: 'ဘေးပတ်လည်တွင် အမဲများ ဝိုင်းနေလျှင် မြင်း ရွှေ့နိုင်ပါသလား။', en: 'Can a Myin move when it is surrounded by other pieces?' },
      choices: [YES, NO],
      correct: 0,
      hint: { my: 'မြင်းသည် ကျော်ခုန်သဖြင့် ဝိုင်းထားခြင်းက မတားဆီးနိုင်ပါ။', en: 'It jumps, so being hemmed in does not stop it.' },
    },
  ],
};

const sin: Lesson = {
  id: 'sin',
  icon: 's',
  title: { my: 'ဆင်', en: 'The Sin' },
  summary: { my: 'ထောင့်ဖြတ် လေးကွက်နှင့် ရှေ့တည့်တည့် တစ်ကွက်', en: 'Four diagonals and one step forward' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/7p/8/8/3S4/8/1P6/K7[] w - - 0 20',
      text: {
        my: 'ဆင်သည် ထောင့်ဖြတ် တစ်ကွက် လေးဘက်သို့ ရွှေ့နိုင်ပြီး ရှေ့တည့်တည့်သို့လည်း တစ်ကွက် ရွှေ့နိုင်သည်။ နောက်ပြန် တည့်တည့် မရွှေ့နိုင်ပါ။',
        en: 'The Sin steps one square diagonally in any of the four directions, and one square straight forward. It cannot step straight back.',
      },
    },
    {
      kind: 'squares',
      fen: '7k/7p/8/8/3S4/8/1P6/K7[] w - - 0 20',
      targetsOf: 'd4',
      answer: ['c3', 'c5', 'd5', 'e3', 'e5'],
      text: { my: 'd4 ရှိ ဆင် ရောက်နိုင်သော အကွက်အားလုံးကို တို့ပါ။', en: 'Tap every square the Sin on d4 can reach.' },
      hint: { my: 'ငါးကွက် ရှိသည် — ထောင့်ဖြတ်လေးကွက်နှင့် ရှေ့တည့်တည့် တစ်ကွက်။', en: 'Five squares: four diagonals plus the one straight ahead.' },
    },
    {
      kind: 'move',
      fen: '7k/7p/8/8/3S4/8/1P6/K7[] w - - 0 20',
      solutions: ['d4d5'],
      text: { my: 'ဆင်ကို ရှေ့တည့်တည့်သို့ ရွှေ့ပါ။', en: 'Move the Sin straight forward.' },
      hint: { my: 'ဤသည်မှာ ထောင့်ဖြတ် မဟုတ်သော တစ်ခုတည်းသော ရွှေ့ကွက်ဖြစ်သည်။', en: 'It is its only non-diagonal move.' },
    },
    {
      kind: 'quiz',
      fen: '7k/7p/8/8/3S4/8/1P6/K7[] w - - 0 20',
      text: { my: 'ဆင်သည် နောက်သို့ တည့်တည့် ဆုတ်နိုင်ပါသလား။', en: 'Can a Sin step straight backward?' },
      choices: [NO, YES],
      correct: 0,
      hint: { my: 'နောက်ပြန်ဆုတ်လိုလျှင် ထောင့်ဖြတ်ဖြင့်သာ ဆုတ်ရသည်။', en: 'To go back it must go diagonally.' },
    },
  ],
};

const sitke: Lesson = {
  id: 'sitke',
  icon: 'f',
  title: { my: 'စစ်ကဲ', en: 'The Sit-ke' },
  summary: { my: 'ထောင့်ဖြတ် တစ်ကွက်', en: 'One step on the diagonal' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/7p/8/8/3F4/8/1P6/K7[] w - - 0 20',
      text: {
        my: 'စစ်ကဲသည် ထောင့်ဖြတ် တစ်ကွက်သာ ရွှေ့သည်။ အားနည်းသော်လည်း မင်းကြီး၏ အနီးဆုံး အစောင့်ဖြစ်သည်။',
        en: 'The Sit-ke steps exactly one square diagonally. It is weak, but it is the Min-gyi’s closest guard.',
      },
    },
    {
      kind: 'squares',
      fen: '7k/7p/8/8/3F4/8/1P6/K7[] w - - 0 20',
      targetsOf: 'd4',
      answer: ['c3', 'c5', 'e3', 'e5'],
      text: { my: 'd4 ရှိ စစ်ကဲ ရောက်နိုင်သော အကွက်အားလုံးကို တို့ပါ။', en: 'Tap every square the Sit-ke on d4 can reach.' },
      hint: { my: 'ထောင့်လေးဘက် — တစ်ကွက်စီသာ။', en: 'Four corners, one square each.' },
    },
    {
      kind: 'move',
      fen: '7k/7p/8/8/3F4/8/1P6/K7[] w - - 0 20',
      solutions: ['d4c5', 'd4e5'],
      text: { my: 'စစ်ကဲကို ရှေ့သို့ ထောင့်ဖြတ် ရွှေ့ပါ။', en: 'Move the Sit-ke forward along a diagonal.' },
      hint: { my: 'အပေါ်သို့ ဦးတည်သော ထောင့်နှစ်ခု ရှိသည်။', en: 'Two of its four diagonals go up the board.' },
    },
    {
      kind: 'quiz',
      fen: '7k/7p/8/8/3F4/8/1P6/K7[] w - - 0 20',
      text: { my: 'စစ်ကဲသည် ထောင့်ဖြတ်အတိုင်း အဝေးသို့ ရွှေ့နိုင်ပါသလား။', en: 'Can a Sit-ke slide far along its diagonal?' },
      choices: [NO, YES],
      correct: 0,
      hint: { my: 'တစ်ကြိမ်လျှင် တစ်ကွက်သာ။', en: 'One square at a time.' },
    },
  ],
};

const mingyi: Lesson = {
  id: 'mingyi',
  icon: 'k',
  title: { my: 'မင်းကြီး', en: 'The Min-gyi' },
  summary: { my: 'ဘက်တိုင်းသို့ တစ်ကွက်', en: 'One step in any direction' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/7p/8/8/3K4/8/1P6/8[] w - - 0 20',
      text: {
        my: 'မင်းကြီးသည် ဘက်တိုင်းသို့ တစ်ကွက်စီ ရွှေ့သည်။ ပွဲတစ်ပွဲလုံးသည် မင်းကြီးအတွက်ဖြစ်သည် — မင်းကြီး ဆုံးလျှင် ပွဲပြီးသည်။',
        en: 'The Min-gyi steps one square in any direction. The whole game is about him: lose him and the game is over.',
      },
    },
    {
      kind: 'squares',
      fen: '7k/7p/8/8/3K4/8/1P6/8[] w - - 0 20',
      targetsOf: 'd4',
      answer: ['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'e5'],
      text: { my: 'd4 ရှိ မင်းကြီး ရောက်နိုင်သော အကွက်အားလုံးကို တို့ပါ။', en: 'Tap every square the Min-gyi on d4 can reach.' },
      hint: { my: 'ပတ်လည်ရှိ အကွက်ရှစ်ခုလုံး။', en: 'All eight squares around him.' },
    },
    {
      kind: 'quiz',
      fen: '7k/7p/8/8/3K4/8/1P6/8[] w - - 0 20',
      text: { my: 'မင်းကြီးနှစ်ပါး ကပ်လျက် ရပ်နိုင်ပါသလား။', en: 'May the two Min-gyi ever stand next to each other?' },
      choices: [NO, YES],
      correct: 0,
      hint: {
        my: 'ကပ်လျက်ရပ်လျှင် မင်းကြီးတစ်ပါး ရှင်တိုက်ခံရမည်ဖြစ်၍ ထိုရွှေ့ကွက်သည် တရားမဝင်ပါ။',
        en: 'Standing next to each other would put a Min-gyi in check, so the move is never legal.',
      },
    },
  ],
};

const promotion: Lesson = {
  id: 'promotion',
  icon: 'promotion',
  title: { my: 'အဆင့်တိုးခြင်း', en: 'Promotion' },
  summary: { my: 'နေမှ စစ်ကဲသို့', en: 'From Ne to Sit-ke' },
  xp: 20,
  steps: [
    {
      kind: 'info',
      fen: '7k/7p/8/3P4/8/8/1P6/K7[] w - - 0 20',
      highlight: WHITE_DIAGONAL,
      text: {
        my: 'နေတစ်ခုသည် စစ်ကဲအဖြစ် အဆင့်တိုးနိုင်သည်။ သို့သော် နောက်ဆုံးတန်းရောက်မှ မဟုတ်ဘဲ — ပြိုင်ဘက်ဘက်ခြမ်းရှိ ထောင့်ဖြတ်မျဉ်းကြီးနှစ်ခုပေါ်မှသာ တိုးနိုင်သည်။ ဤအကွက်များကို ကစားကွက်ပေါ်တွင် ရေးဆွဲပြထားသည်။',
        en: 'A Ne can become a Sit-ke. Not by reaching the last rank, though: it promotes from the two long diagonals in the opponent’s half — the lines drawn across the board.',
      },
    },
    {
      kind: 'info',
      fen: '7k/7p/8/3P4/8/8/1P6/K7[] w - - 0 20',
      text: {
        my: 'အဆင့်တိုးခြင်းသည် သီးခြား ရွှေ့ကွက်တစ်ခုဖြစ်သည်။ စစ်ကဲအသစ်သည် နေ၏ အကွက်ပေါ်တွင်ပင် ရပ်နိုင်သည်၊ သို့မဟုတ် ဗလာဖြစ်သော ထောင့်ဖြတ် အိမ်နီးချင်းအကွက်တစ်ခုပေါ် ရပ်နိုင်သည်။ မည်သည့်အခါမျှ ဖမ်းယူခြင်း မပြုပါ။',
        en: 'Promotion is a move of its own. The new Sit-ke stands on the Ne’s own square, or on an empty diagonal neighbour. It never captures.',
      },
    },
    {
      kind: 'move',
      fen: '7k/7p/8/3P4/8/8/1P6/K7[] w - - 0 20',
      solutions: ['d5d5f', 'd5c6f', 'd5e6f', 'd5c4f', 'd5e4f'],
      text: { my: 'd5 ရှိ နေကို စစ်ကဲအဖြစ် အဆင့်တိုးပါ။', en: 'Promote the Ne on d5 into a Sit-ke.' },
      hint: {
        my: 'နေကို ရွေးပြီး "အဆင့်တိုးရန်" ခလုတ်ကို နှိပ်ပါ၊ သို့မဟုတ် ထောင့်ဖြတ် အိမ်နီးချင်း ဗလာအကွက်တစ်ခုကို ရွေးပါ။',
        en: 'Select the Ne and press “Promote”, or choose one of its empty diagonal neighbours.',
      },
      success: { my: 'd5 သည် အဖြူဘက်၏ ထောင့်ဖြတ်မျဉ်းပေါ်တွင် ရှိသည်။', en: 'd5 sits on one of White’s promotion diagonals.' },
    },
    {
      kind: 'quiz',
      fen: '7k/7p/8/3P4/8/8/1P6/K7[] w - - 0 20',
      text: { my: 'b2 ရှိ နေသည် ယခုအချိန်တွင် အဆင့်တိုး၍ ရပါသလား။', en: 'Can the Ne on b2 promote right now?' },
      choices: [NO, YES],
      correct: 0,
      hint: {
        my: 'b2 သည် ထောင့်ဖြတ်မျဉ်းပေါ်တွင် မရှိပါ။ ခြွင်းချက်တစ်ခုသာရှိသည် — မိမိ၏ နောက်ဆုံးနေဖြစ်ပါက မည်သည့်အကွက်မှမဆို တိုးနိုင်သည်။',
        en: 'b2 is not on a diagonal. There is one exception: your last remaining Ne may promote from any square.',
      },
    },
    {
      kind: 'quiz',
      fen: '7k/7p/8/3P4/8/8/1P6/K7[] w - - 0 20',
      text: {
        my: 'ကစားကွက်ပေါ်တွင် မိမိ၏ စစ်ကဲ ရှိနေသေးလျှင် နေတစ်ခုကို အဆင့်တိုး၍ ရပါသလား။',
        en: 'May you promote a Ne while you still have a Sit-ke on the board?',
      },
      choices: [NO, YES],
      correct: 0,
      hint: {
        my: 'တစ်ဖက်လျှင် စစ်ကဲတစ်ခုသာ ရှိရသည်။ ထို့ပြင် စစ်ကဲအသစ်သည် ပြိုင်ဘက်အမဲကို မခြိမ်းခြောက်ရ၊ ရှင်လည်း မတိုက်ရပါ။',
        en: 'A side may only have one Sit-ke. On top of that, the new Sit-ke may not attack any enemy piece and may not give check.',
      },
    },
  ],
};

const check: Lesson = {
  id: 'check',
  icon: 'check',
  title: { my: 'ရှင်တိုက်ခြင်း', en: 'Check' },
  summary: { my: 'မင်းကြီး အန္တရာယ်ရှိသောအခါ', en: 'When your Min-gyi is attacked' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: '4r2k/8/8/R7/8/8/8/4K3[] w - - 0 20',
      text: {
        my: 'မင်းကြီးကို ပြိုင်ဘက်အမဲက ခြိမ်းခြောက်နေလျှင် ရှင်တိုက်သည်ဟု ခေါ်သည်။ ရှင်တိုက်ခံရလျှင် ထိုအခြေအနေမှ ချက်ချင်း ဖြေရှင်းရမည်။',
        en: 'When an enemy piece attacks your Min-gyi, that is check. You must answer it at once.',
      },
    },
    {
      kind: 'squares',
      fen: '4r2k/8/8/R7/8/8/8/4K3[] w - - 0 20',
      targetsOf: 'e1',
      answer: ['d1', 'd2', 'f1', 'f2'],
      text: { my: 'မင်းကြီး ထွက်ပြေးနိုင်သော အကွက်များကို တို့ပါ။', en: 'Tap the squares the Min-gyi can escape to.' },
      hint: { my: 'e တိုင်ပေါ်တွင် ဆက်ရှိနေလျှင် ရထားက ဆက်လက် ရှင်တိုက်နေဦးမည်။', en: 'Staying on the e-file leaves him on the Yahhta’s line.' },
    },
    {
      kind: 'move',
      fen: '4r2k/8/8/R7/8/8/8/4K3[] w - - 0 20',
      solutions: ['a5e5'],
      text: { my: 'မင်းကြီးကို မရွှေ့ဘဲ ရှင်ကို ပိတ်ပါ။', en: 'Block the check without moving your Min-gyi.' },
      hint: { my: 'မိမိရထားကို ရထားမျဉ်းပေါ်သို့ ရွှေ့ပါ။', en: 'Put your own Yahhta on the line of attack.' },
      success: { my: 'ရှင်ဖြေရန် နည်းသုံးမျိုးရှိသည် — ရွှေ့ခြင်း၊ ပိတ်ခြင်း၊ ဖမ်းခြင်း။', en: 'There are three answers to a check: move, block, capture.' },
    },
    {
      kind: 'quiz',
      fen: '4r2k/8/8/R7/8/8/8/4K3[] w - - 0 20',
      text: { my: 'ရှင်တိုက်ခံနေရလျက် အခြားရွှေ့ကွက်တစ်ခု ရွှေ့၍ ရပါသလား။', en: 'While in check, may you play some other move instead?' },
      choices: [NO, YES],
      correct: 0,
      hint: { my: 'ရှင်ကို မဖြေနိုင်သော ရွှေ့ကွက်တိုင်း တရားမဝင်ပါ။', en: 'Any move that does not answer the check is illegal.' },
    },
  ],
};

const mate: Lesson = {
  id: 'mate',
  icon: 'mate',
  title: { my: 'ရှင်သေ', en: 'Checkmate' },
  summary: { my: 'ပွဲကို အနိုင်ယူခြင်း', en: 'How the game is won' },
  xp: 20,
  steps: [
    {
      kind: 'info',
      fen: 'k7/8/1K6/8/8/8/8/7R[] w - - 0 40',
      text: {
        my: 'ရှင်တိုက်ခံရပြီး မည်သည့်နည်းနှင့်မျှ မဖြေနိုင်တော့လျှင် ရှင်သေဖြစ်သည်။ ရှင်သေသည်နှင့် ပွဲပြီးဆုံးပြီး တိုက်ခိုက်သူက အနိုင်ရသည်။',
        en: 'When a check cannot be answered at all, it is checkmate. The game ends there and the attacker wins.',
      },
    },
    {
      kind: 'move',
      fen: 'k7/8/1K6/8/8/8/8/7R[] w - - 0 40',
      solutions: ['h1h8'],
      text: { my: 'ရွှေ့ကွက်တစ်ခုဖြင့် ရှင်သေအောင် လုပ်ပါ။', en: 'Deliver checkmate in one move.' },
      hint: {
        my: 'မင်းကြီးက a7၊ b7၊ b8 ကို ပိတ်ထားပြီးဖြစ်သည်။ ရှစ်တန်းကို ရထားဖြင့် ပိတ်လိုက်ပါ။',
        en: 'Your Min-gyi already covers a7, b7 and b8. Take the eighth rank with the Yahhta.',
      },
      success: { my: 'အမည်းမင်းကြီးမှာ ထွက်ပေါက် မကျန်တော့ပါ။', en: 'The Black Min-gyi has nowhere left to go.' },
    },
    {
      kind: 'quiz',
      fen: 'k7/8/1K6/8/8/8/8/7R[] w - - 0 40',
      text: {
        my: 'ရှင်မတိုက်ခံရဘဲ တရားဝင် ရွှေ့ကွက် မကျန်တော့လျှင် ရလဒ်က ဘာဖြစ်မည်နည်း။',
        en: 'What is the result when a player has no legal move but is not in check?',
      },
      choices: [
        { my: 'သရေ', en: 'A draw' },
        { my: 'ရွှေ့စရာမရှိသူ ရှုံးသည်', en: 'The player with no move loses' },
        { my: 'ရွှေ့စရာမရှိသူ နိုင်သည်', en: 'The player with no move wins' },
      ],
      correct: 0,
      hint: { my: 'ထိုအခြေအနေကို ရွှေ့စရာမရှိခြင်းဟု ခေါ်ပြီး သရေဖြစ်သည်။', en: 'That is stalemate, and it is a draw.' },
    },
  ],
};

const counting: Lesson = {
  id: 'counting',
  icon: 'count',
  title: { my: 'ရေတွက်ခြင်း', en: 'Counting' },
  summary: { my: 'အာဆီယံ ရေတွက်နည်း', en: 'The ASEAN count' },
  xp: 20,
  steps: [
    {
      kind: 'info',
      fen: '4k3/8/8/8/8/8/R7/4K3[] w - - 0 40',
      text: {
        my: 'ကစားကွက်ပေါ်တွင် နေတစ်ခုမှ မကျန်တော့ဘဲ တစ်ဖက်တွင် မင်းကြီးတစ်ပါးတည်းသာ ကျန်လျှင် ရေတွက်ခြင်း စတင်သည်။ အားသာသူသည် ကန့်သတ်ရွှေ့ကွက်အတွင်း ရှင်သေအောင် လုပ်ရမည်၊ မဟုတ်လျှင် သရေဖြစ်သည်။',
        en: 'When no Ne is left on the board and one side has a bare Min-gyi, a count begins. The stronger side must mate within the limit, or the game is a draw.',
      },
      verify: { fen: '4k3/8/8/8/8/8/R7/4K3[] w - - 0 40', move: 'a2a8', limitPlies: 32 },
    },
    {
      kind: 'info',
      fen: '4k3/8/8/8/8/8/R7/4K3[] w - - 0 40',
      text: {
        my: 'ကန့်သတ်ချက်သည် အားသာသူ၏ အကောင်းဆုံးအမဲပေါ် မူတည်သည်။ ရထားရှိလျှင် ရွှေ့ကွက် ၁၆ ကွက်သာ ရသည် — အတိုဆုံးဖြစ်သည်။',
        en: 'The limit depends only on the strongest attacking piece. With a Yahhta you get 16 moves — the shortest count of all.',
      },
      verify: { fen: '4k3/8/8/8/8/8/R7/4K3[] w - - 0 40', move: 'a2a8', limitPlies: 32 },
    },
    {
      kind: 'info',
      fen: '4k3/8/8/8/8/8/S7/4K3[] w - - 0 40',
      text: {
        my: 'ရထားမရှိဘဲ ဆင်ရှိလျှင် ရွှေ့ကွက် ၄၄ ကွက်။ ဆင်လည်းမရှိဘဲ မြင်းရှိလျှင် ရွှေ့ကွက် ၆၄ ကွက်။ အမဲ အားနည်းလေ အချိန်များလေ ဖြစ်သည်။',
        en: 'A Sin instead gives 44 moves, and a Myin 64. The weaker the piece, the more time you are given.',
      },
      verify: { fen: '4k3/8/8/8/8/8/S7/4K3[] w - - 0 40', move: 'a2a3', limitPlies: 88 },
    },
    {
      kind: 'quiz',
      fen: '4k3/8/8/8/8/8/8/1N2K3[] w - - 0 40',
      text: { my: 'မြင်းတစ်ကောင်တည်းဖြင့် ရေတွက်ချိန် ဘယ်လောက် ရသနည်း။', en: 'How long is the count when a lone Myin is the strongest piece?' },
      choices: [
        { my: 'ရွှေ့ကွက် ၁၆ ကွက်', en: '16 moves' },
        { my: 'ရွှေ့ကွက် ၄၄ ကွက်', en: '44 moves' },
        { my: 'ရွှေ့ကွက် ၆၄ ကွက်', en: '64 moves' },
      ],
      correct: 2,
      hint: { my: 'မြင်းသည် အားအနည်းဆုံးဖြစ်၍ အချိန် အများဆုံး ရသည်။', en: 'The Myin is the weakest of the three, so it gets the most time.' },
      verify: { fen: '4k3/8/8/8/8/8/8/1N2K3[] w - - 0 40', move: 'b1c3', limitPlies: 128 },
    },
    {
      kind: 'quiz',
      fen: '4k3/8/8/8/8/8/8/1F2K3[] w - - 0 40',
      text: { my: 'စစ်ကဲသာ ကျန်လျှင် ရေတွက်ခြင်း ရှိပါသလား။', en: 'Does a count run when only a Sit-ke is left?' },
      choices: [NO, YES],
      correct: 0,
      hint: {
        my: 'စစ်ကဲနှင့် နေတို့ဖြင့် ရှင်သေအောင် မလုပ်နိုင်သဖြင့် ရေတွက်ရန် အကြောင်းမရှိပါ။',
        en: 'A Sit-ke and Ne cannot force mate, so there is nothing to count.',
      },
      verify: { fen: '4k3/8/8/8/8/8/8/1F2K3[] w - - 0 40', move: 'b1c2', limitPlies: 0 },
    },
  ],
};

export const UNITS: Unit[] = [
  {
    id: 'start',
    title: { my: 'ကစားကွက်နှင့် တပ်စီစဉ်ခြင်း', en: 'The board and the setup' },
    lessons: [board, setup],
  },
  {
    id: 'pieces',
    title: { my: 'အမဲများ', en: 'The pieces' },
    lessons: [ne, yahhta, myin, sin, sitke, mingyi],
  },
  {
    id: 'winning',
    title: { my: 'အနိုင်ရခြင်း', en: 'Winning the game' },
    lessons: [promotion, check, mate, counting],
  },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);

export function findLesson(id: string | undefined): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}
