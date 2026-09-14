import type { Lesson, Unit } from './types';

const START = 'rnsmksnr/8/pppppppp/8/8/PPPPPPPP/8/RNSKMSNR w - - 0 1';

const NOT_ALLOWED = { th: 'ไม่ได้', en: 'No' };
const ALLOWED = { th: 'ได้', en: 'Yes' };

const board: Lesson = {
  id: 'board',
  icon: 'board',
  title: { th: 'รู้จักกระดาน', en: 'Meet the board' },
  summary: { th: 'กระดานและตำแหน่งเริ่มต้น', en: 'The board and starting position' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: START,
      text: {
        th: 'นี่คือกระดานหมากรุกไทย มี 8×8 ช่อง ทุกช่องสีเดียวกัน ฝ่ายขาวอยู่ด้านล่าง ฝ่ายดำอยู่ด้านบน',
        en: 'This is the Makruk board: 8×8 squares, all the same colour. White sits at the bottom, Black at the top.',
      },
    },
    {
      kind: 'info',
      fen: START,
      highlight: ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6'],
      text: {
        th: 'เบี้ยตั้งอยู่แถวที่สามของแต่ละฝ่าย ไม่ใช่แถวที่สองเหมือนหมากรุกสากล',
        en: "Each side's Bia (pawns) start on their third row — not the second row as in Western chess.",
      },
    },
    {
      kind: 'squares',
      fen: START,
      answer: ['d1'],
      text: { th: 'แตะช่องที่ขุนขาวตั้งอยู่', en: 'Tap the square where the White Khun stands.' },
      hint: { th: 'ขุนคือหมากที่มีมงกุฎ ขุนขาวอยู่ข้างเม็ด', en: 'The Khun wears the crown. White’s Khun stands next to its Met.' },
    },
    {
      kind: 'squares',
      fen: START,
      answer: ['e1'],
      text: { th: 'แตะช่องที่เม็ดขาวตั้งอยู่', en: 'Tap the square where the White Met stands.' },
      hint: { th: 'เม็ดอยู่ข้างขุน ทางด้านขวา', en: 'The Met stands right beside the Khun.' },
    },
    {
      kind: 'quiz',
      fen: START,
      text: { th: 'ขุนของสองฝ่ายตั้งหันหน้าตรงกันหรือไม่?', en: 'Do the two Khuns start facing each other?' },
      choices: [
        { th: 'ตรงกัน', en: 'Yes' },
        { th: 'ไม่ตรงกัน — ขุนขาวอยู่ d1 ขุนดำอยู่ e8', en: 'No — the White Khun is on d1, the Black Khun on e8' },
      ],
      correct: 1,
      hint: { th: 'ดูที่แถวบนสุดและล่างสุดอีกครั้ง', en: 'Look at the top and bottom rows again.' },
    },
  ],
};

const khun: Lesson = {
  id: 'khun',
  icon: 'k',
  title: { th: 'ขุน', en: 'The Khun' },
  summary: { th: 'หมากที่สำคัญที่สุด', en: 'The most important piece' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/8/8/8/3K4/8/8/8 w - - 0 1',
      highlight: ['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'e5'],
      text: {
        th: 'ขุนเดินได้ทีละหนึ่งช่องในทุกทิศทาง ถ้าขุนถูกรุกจนเดินหนีไม่ได้ ฝ่ายนั้นแพ้',
        en: 'The Khun moves one square in any direction. If your Khun is checkmated, you lose.',
      },
    },
    {
      kind: 'squares',
      fen: '7k/8/8/8/3K4/8/8/8 w - - 0 1',
      targetsOf: 'd4',
      answer: ['c3', 'c4', 'c5', 'd3', 'd5', 'e3', 'e4', 'e5'],
      text: { th: 'แตะทุกช่องที่ขุนขาวเดินไปได้', en: 'Tap every square the White Khun can move to.' },
      hint: { th: 'มีทั้งหมด 8 ช่องรอบตัวขุน', en: 'There are 8 squares around the Khun.' },
    },
    {
      kind: 'move',
      fen: '7k/8/8/8/4p3/3K4/8/8 w - - 0 1',
      solutions: ['d3e4'],
      text: { th: 'ใช้ขุนกินเบี้ยดำ', en: 'Capture the Black Bia with your Khun.' },
      hint: { th: 'ขุนกินได้เหมือนการเดิน คือหนึ่งช่อง', en: 'The Khun captures the same way it moves — one square.' },
      success: { th: 'เยี่ยม! ขุนกินหมากที่อยู่ติดกันได้', en: 'Great! The Khun can capture next to it.' },
    },
    {
      kind: 'move',
      fen: '7k/8/8/8/8/8/3r4/3K4 w - - 0 1',
      solutions: ['d1d2'],
      text: {
        th: 'ขุนขาวถูกเรือรุก! ใช้ขุนกินเรือที่รุกอยู่',
        en: 'The White Khun is in check from the Ruea! Capture the checking Ruea with your Khun.',
      },
      hint: { th: 'เรืออยู่ติดกับขุนและไม่มีหมากป้องกัน', en: 'The Ruea is right next to your Khun and nothing protects it.' },
    },
    {
      kind: 'quiz',
      text: { th: 'ขุนสองฝ่ายยืนติดกันได้หรือไม่?', en: 'Can the two Khuns stand next to each other?' },
      choices: [ALLOWED, { th: 'ไม่ได้ — ขุนห้ามเดินเข้าช่องที่ถูกโจมตี', en: 'No — a Khun may never step into attack' }],
      correct: 1,
    },
  ],
};

const met: Lesson = {
  id: 'met',
  icon: 'm',
  title: { th: 'เม็ด', en: 'The Met' },
  summary: { th: 'เดินทแยงทีละช่อง', en: 'One step diagonally' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/8/8/8/3M4/8/8/K7 w - - 0 1',
      highlight: ['c3', 'c5', 'e3', 'e5'],
      text: { th: 'เม็ดเดินทแยงได้ทีละหนึ่งช่อง ไปได้ 4 ทิศ', en: 'The Met moves one square diagonally, in 4 directions.' },
    },
    {
      kind: 'squares',
      fen: '7k/8/8/8/3M4/8/8/K7 w - - 0 1',
      targetsOf: 'd4',
      answer: ['c3', 'c5', 'e3', 'e5'],
      text: { th: 'แตะทุกช่องที่เม็ดขาวเดินไปได้', en: 'Tap every square the White Met can move to.' },
      hint: { th: 'เฉพาะช่องทแยงที่อยู่ติดกัน', en: 'Only the diagonally adjacent squares.' },
    },
    {
      kind: 'move',
      fen: '7k/8/8/2r5/3M4/8/8/K7 w - - 0 1',
      solutions: ['d4c5'],
      text: { th: 'ใช้เม็ดกินเรือดำ', en: 'Capture the Black Ruea with your Met.' },
      hint: { th: 'เรืออยู่ทแยงมุมกับเม็ด', en: 'The Ruea is diagonal to your Met.' },
    },
    {
      kind: 'quiz',
      text: { th: 'เม็ดเดินตรงไปข้างหน้าได้หรือไม่?', en: 'Can the Met move straight forward?' },
      choices: [ALLOWED, { th: 'ไม่ได้ — เดินได้เฉพาะแนวทแยง', en: 'No — only diagonally' }],
      correct: 1,
    },
  ],
};

const khon: Lesson = {
  id: 'khon',
  icon: 's',
  title: { th: 'โคน', en: 'The Khon' },
  summary: { th: 'ทแยงหรือตรงไปข้างหน้า', en: 'Diagonal or straight ahead' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/8/8/8/3S4/8/8/K7 w - - 0 1',
      highlight: ['c3', 'c5', 'd5', 'e3', 'e5'],
      text: {
        th: 'โคนเดินทแยงได้ทีละช่องทั้ง 4 ทิศ และเดินตรงไปข้างหน้าได้หนึ่งช่อง',
        en: 'The Khon moves one square diagonally in any direction, or one square straight forward.',
      },
    },
    {
      kind: 'squares',
      fen: '7k/8/8/8/3S4/8/8/K7 w - - 0 1',
      targetsOf: 'd4',
      answer: ['c3', 'c5', 'd5', 'e3', 'e5'],
      text: { th: 'แตะทุกช่องที่โคนขาวเดินไปได้', en: 'Tap every square the White Khon can move to.' },
      hint: { th: 'ทแยง 4 ช่อง และตรงไปข้างหน้าอีก 1 ช่อง', en: 'Four diagonal squares plus one straight ahead.' },
    },
    {
      kind: 'move',
      fen: '7k/8/8/3n4/3S4/8/8/K7 w - - 0 1',
      solutions: ['d4d5'],
      text: { th: 'ใช้โคนกินม้าดำที่อยู่ตรงหน้า', en: 'Capture the Black Ma straight in front of your Khon.' },
      hint: { th: 'โคนกินตรงไปข้างหน้าได้', en: 'The Khon can capture straight ahead.' },
    },
    {
      kind: 'quiz',
      text: { th: 'โคนเดินถอยหลังตรง ๆ ได้หรือไม่?', en: 'Can the Khon move straight backwards?' },
      choices: [ALLOWED, { th: 'ไม่ได้ — ถอยได้เฉพาะแนวทแยง', en: 'No — it can only retreat diagonally' }],
      correct: 1,
    },
  ],
};

const ma: Lesson = {
  id: 'ma',
  icon: 'n',
  title: { th: 'ม้า', en: 'The Ma' },
  summary: { th: 'กระโดดเป็นรูปตัว L', en: 'Jumps in an L-shape' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/8/8/8/3N4/8/8/K7 w - - 0 1',
      highlight: ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5'],
      text: {
        th: 'ม้าเดินเป็นรูปตัว L คือตรงสองช่องแล้วเลี้ยวหนึ่งช่อง และกระโดดข้ามหมากตัวอื่นได้',
        en: 'The Ma moves in an L-shape — two squares straight, then one to the side — and jumps over other pieces.',
      },
    },
    {
      kind: 'squares',
      fen: '7k/8/8/8/3N4/8/8/K7 w - - 0 1',
      targetsOf: 'd4',
      answer: ['b3', 'b5', 'c2', 'c6', 'e2', 'e6', 'f3', 'f5'],
      text: { th: 'แตะทุกช่องที่ม้าขาวเดินไปได้', en: 'Tap every square the White Ma can move to.' },
      hint: { th: 'มีทั้งหมด 8 ช่อง', en: 'There are 8 squares.' },
    },
    {
      kind: 'move',
      fen: '7k/8/8/8/8/2r5/PPP5/1N2K3 w - - 0 1',
      solutions: ['b1c3'],
      text: { th: 'ม้ากระโดดข้ามหมากได้ ใช้ม้ากินเรือดำ', en: 'The Ma can jump over pieces. Capture the Black Ruea.' },
      hint: { th: 'เบี้ยที่ขวางอยู่ไม่เป็นปัญหาสำหรับม้า', en: 'The Bia in the way do not stop a Ma.' },
    },
    {
      kind: 'quiz',
      text: { th: 'หมากที่อยู่ติดกับม้าขวางทางม้าได้หรือไม่?', en: 'Can pieces next to the Ma block its move?' },
      choices: [ALLOWED, { th: 'ไม่ได้ — ม้ากระโดดข้ามได้', en: 'No — the Ma jumps over them' }],
      correct: 1,
    },
  ],
};

const ruea: Lesson = {
  id: 'ruea',
  icon: 'r',
  title: { th: 'เรือ', en: 'The Ruea' },
  summary: { th: 'หมากที่แรงที่สุด', en: 'The strongest piece' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/8/8/8/3R4/8/8/K7 w - - 0 1',
      highlight: ['d1', 'd2', 'd3', 'd5', 'd6', 'd7', 'd8', 'a4', 'b4', 'c4', 'e4', 'f4', 'g4', 'h4'],
      text: {
        th: 'เรือเดินตรงตามแนวตั้งหรือแนวนอนกี่ช่องก็ได้ จนกว่าจะเจอหมากขวาง',
        en: 'The Ruea moves any number of squares along a row or column until something blocks it.',
      },
    },
    {
      kind: 'squares',
      fen: '7k/8/8/3p4/1P1R4/8/8/K7 w - - 0 1',
      targetsOf: 'd4',
      answer: ['c4', 'd1', 'd2', 'd3', 'd5', 'e4', 'f4', 'g4', 'h4'],
      text: { th: 'แตะทุกช่องที่เรือเดินไปได้ รวมช่องที่กินหมากได้', en: 'Tap every square the Ruea can reach, including captures.' },
      hint: {
        th: 'เบี้ยขาวขวางทางซ้าย ส่วนเบี้ยดำด้านบนกินได้แต่ผ่านไม่ได้',
        en: 'Your own Bia blocks the left; the Black Bia above can be captured but not passed.',
      },
    },
    {
      kind: 'move',
      fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1',
      solutions: ['a1a8'],
      text: { th: 'เดินเรือไปรุกขุนดำ', en: 'Move the Ruea to give check to the Black Khun.' },
      hint: { th: 'ขุนดำอยู่แถวบนสุด', en: 'The Black Khun is on the top row.' },
    },
    {
      kind: 'quiz',
      text: { th: 'เรือกระโดดข้ามหมากได้หรือไม่?', en: 'Can the Ruea jump over pieces?' },
      choices: [ALLOWED, NOT_ALLOWED],
      correct: 1,
    },
  ],
};

const bia: Lesson = {
  id: 'bia',
  icon: 'p',
  title: { th: 'เบี้ย', en: 'The Bia' },
  summary: { th: 'เดินหน้าทีละช่อง กินทแยง', en: 'Forward one, captures diagonally' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/8/8/8/8/4P3/8/K7 w - - 0 1',
      highlight: ['e4'],
      text: {
        th: 'เบี้ยเดินตรงไปข้างหน้าได้ทีละหนึ่งช่องเท่านั้น แม้ตาแรกก็เดินสองช่องไม่ได้',
        en: 'The Bia moves straight forward one square — never two, not even on its first move.',
      },
    },
    {
      kind: 'move',
      fen: '7k/8/8/8/3r1n2/4P3/8/K7 w - - 0 1',
      solutions: ['e3d4'],
      text: { th: 'เบี้ยกินทแยงไปข้างหน้า ใช้เบี้ยกินเรือดำ', en: 'The Bia captures diagonally forward. Capture the Black Ruea.' },
      hint: { th: 'เรือมีค่ามากกว่าม้า', en: 'The Ruea is worth more than the Ma.' },
    },
    {
      kind: 'quiz',
      text: { th: 'เบี้ยกินหมากที่อยู่ตรงหน้าได้หรือไม่?', en: 'Can a Bia capture the piece straight in front of it?' },
      choices: [ALLOWED, { th: 'ไม่ได้ — กินได้เฉพาะแนวทแยงไปข้างหน้า', en: 'No — only diagonally forward' }],
      correct: 1,
    },
  ],
};

const promotion: Lesson = {
  id: 'promotion',
  icon: 'promotion',
  title: { th: 'เบี้ยหงาย', en: 'Promotion' },
  summary: { th: 'เบี้ยกลายเป็นเม็ด', en: 'The Bia becomes a Met' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '7k/8/8/P7/8/8/8/K7 w - - 0 1',
      highlight: ['a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6'],
      text: {
        th: 'เมื่อเบี้ยเดินถึงแถวที่หก (แถวเบี้ยของฝ่ายตรงข้าม) เบี้ยจะหงายและเดินได้เหมือนเม็ด',
        en: "When a Bia reaches the sixth row (where the opponent's Bia started), it is promoted and moves like a Met.",
      },
    },
    {
      kind: 'move',
      fen: '7k/8/8/P7/8/8/8/K7 w - - 0 1',
      solutions: ['a5a6m'],
      text: { th: 'เดินเบี้ยไปแถวที่หกเพื่อหงายเบี้ย', en: 'Push the Bia to the sixth row to promote it.' },
      hint: { th: 'เบี้ยอยู่แถวที่ห้า เหลืออีกหนึ่งช่อง', en: 'The Bia is on the fifth row — one more step.' },
      success: { th: 'เบี้ยหงายแล้ว! ตอนนี้เดินได้เหมือนเม็ด', en: 'Promoted! It now moves like a Met.' },
    },
    {
      kind: 'quiz',
      text: { th: 'เบี้ยหงายเดินได้เหมือนหมากตัวใด?', en: 'A promoted Bia moves like which piece?' },
      choices: [
        { th: 'เรือ', en: 'Ruea' },
        { th: 'เม็ด', en: 'Met' },
        { th: 'ม้า', en: 'Ma' },
      ],
      correct: 1,
    },
  ],
};

const check: Lesson = {
  id: 'check',
  icon: 'check',
  title: { th: 'รุก', en: 'Check' },
  summary: { th: 'โจมตีขุนฝ่ายตรงข้าม', en: "Attacking the enemy Khun" },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '4k3/8/8/8/8/8/8/4R1K1 b - - 0 1',
      text: {
        th: 'รุก คือการที่หมากโจมตีขุนฝ่ายตรงข้าม ฝ่ายที่ถูกรุกต้องแก้การรุกทันที',
        en: 'Check means a piece attacks the enemy Khun. The side in check must get out of it immediately.',
      },
    },
    {
      kind: 'move',
      fen: '4k3/8/8/8/8/8/1R6/4K3 w - - 0 1',
      solutions: ['b2b8', 'b2e2'],
      text: { th: 'เดินเรือไปรุกขุนดำ', en: 'Move the Ruea to give check to the Black Khun.' },
      hint: { th: 'เรือรุกได้ทั้งตามแถวนอนและแถวตั้ง', en: 'The Ruea can check along a row or a column.' },
    },
    {
      kind: 'quiz',
      fen: '4k3/8/8/8/8/8/8/4R1K1 b - - 0 1',
      text: { th: 'ขุนดำถูกรุก ข้อใดไม่ใช่วิธีแก้รุก?', en: 'Black is in check. Which is NOT a way out of check?' },
      choices: [
        { th: 'เดินขุนหนี', en: 'Move the Khun away' },
        { th: 'เอาหมากมาขวางทาง', en: 'Block the attack' },
        { th: 'เดินหมากตัวอื่นโดยไม่สนใจการรุก', en: 'Move another piece and ignore the check' },
      ],
      correct: 2,
    },
  ],
};

const checkmate: Lesson = {
  id: 'checkmate',
  icon: 'mate',
  title: { th: 'รุกจน', en: 'Checkmate' },
  summary: { th: 'วิธีชนะเกม', en: 'How to win the game' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: 'R6k/1R6/8/8/8/8/8/4K3 b - - 0 1',
      text: {
        th: 'รุกจน คือขุนถูกรุกและไม่มีทางแก้ ฝ่ายที่ถูกรุกจนแพ้ทันที',
        en: 'Checkmate: the Khun is in check and there is no way out. The side that is checkmated loses.',
      },
    },
    {
      kind: 'move',
      fen: 'k7/2R5/8/8/8/8/8/4K2R w - - 0 1',
      solutions: ['h1h8'],
      text: { th: 'รุกจนในตาเดียว!', en: 'Checkmate in one move!' },
      hint: { th: 'เรือตัวหนึ่งกันแถวที่เจ็ดไว้แล้ว ใช้อีกตัวรุกแถวบนสุด', en: 'One Ruea already guards the seventh row. Use the other on the top row.' },
      success: { th: 'รุกจน! เรือสองลำช่วยกันต้อนขุน', en: 'Checkmate! The two Ruea trap the Khun together.' },
    },
    {
      kind: 'move',
      fen: '6k1/8/6K1/8/8/8/8/R7 w - - 0 1',
      solutions: ['a1a8'],
      text: { th: 'ขุนขาวช่วยกันช่องหนี รุกจนด้วยเรือ', en: 'Your Khun covers the escape squares. Checkmate with the Ruea.' },
      hint: { th: 'ขุนดำหนีลงไม่ได้เพราะขุนขาวคุมอยู่', en: 'The Black Khun cannot step down — your Khun guards those squares.' },
    },
    {
      kind: 'quiz',
      text: {
        th: 'อับ (ไม่มีตาเดินแต่ไม่ถูกรุก) ในหมากรุกไทยผลเป็นอย่างไร?',
        en: 'Stalemate (no legal move but not in check) in Makruk is…',
      },
      choices: [
        { th: 'ชนะ', en: 'A win' },
        { th: 'เสมอ', en: 'A draw' },
        { th: 'แพ้', en: 'A loss' },
      ],
      correct: 1,
    },
  ],
};

const moves = (n: number) => ({ th: `${n} ตา`, en: `${n} moves` });

const counting: Lesson = {
  id: 'counting',
  icon: 'count',
  title: { th: 'การนับศักดิ์', en: 'Counting rules' },
  summary: { th: 'นับศักดิ์กระดานและนับศักดิ์หมาก', en: "Board's honour and pieces' honour" },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: '4k3/3m4/8/8/8/2N5/8/R3K3 b - 128 0 1',
      verify: { fen: '4k3/3m4/8/8/8/8/8/RN2K3 w - - 0 1', move: 'b1c3', limitMoves: 64, kind: 'board' },
      text: {
        th: 'เมื่อไม่มีเบี้ยเหลือบนกระดาน ฝ่ายที่เสียเปรียบนับได้ถึง 64 ตา เรียกว่า "นับศักดิ์กระดาน" ถ้ารุกจนไม่ได้ภายในนั้น เกมเสมอ',
        en: "When no Bia are left, the weaker side counts up to 64 moves — the board's honour count. If there is no checkmate in time, the game is drawn.",
      },
    },
    {
      kind: 'info',
      fen: '4k3/8/8/8/8/8/R7/4K3 b - 32 6 1',
      verify: { fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', move: 'a1a2', limitMoves: 16, kind: 'pieces' },
      text: {
        th: 'ถ้าฝ่ายหนึ่งเหลือขุนตัวเดียว จะ "นับศักดิ์หมาก" ตามหมากของอีกฝ่าย เช่น เจอเรือหนึ่งลำ นับได้ 16 ตา โดยเริ่มนับจากจำนวนหมากบนกระดาน',
        en: "If one side has only its Khun left, it counts by pieces' honour: the limit depends on the attacker's pieces — 16 moves against one Ruea — and the count starts from the number of pieces on the board.",
      },
    },
    {
      kind: 'quiz',
      verify: { fen: '4k3/8/8/8/8/8/8/RR2K3 w - - 0 1', move: 'b1b2', limitMoves: 8, kind: 'pieces' },
      text: { th: 'ขุนเดี่ยวสู้กับเรือสองลำ นับได้กี่ตา?', en: 'A lone Khun against two Ruea may count how many moves?' },
      choices: [moves(8), moves(16), moves(64)],
      correct: 0,
      hint: { th: 'ยิ่งอีกฝ่ายมีหมากแรง ยิ่งนับได้น้อย', en: 'The stronger the attacker, the fewer moves.' },
    },
    {
      kind: 'quiz',
      verify: { fen: '4k3/8/8/8/8/8/8/S3K3 w - - 0 1', move: 'a1a2', limitMoves: 44, kind: 'pieces' },
      text: { th: 'ขุนเดี่ยวสู้กับโคนตัวเดียว (ไม่มีเรือ) นับได้กี่ตา?', en: 'A lone Khun against one Khon (no Ruea) may count how many moves?' },
      choices: [moves(22), moves(44), moves(64)],
      correct: 1,
      hint: { th: 'โคนสองตัวนับ 22 ตา โคนตัวเดียวนับได้มากกว่านั้น', en: 'Two Khon give 22 moves; one Khon gives more.' },
    },
    {
      kind: 'quiz',
      verify: { fen: '4k3/8/8/8/8/8/8/NN2K3 w - - 0 1', move: 'b1d2', limitMoves: 32, kind: 'pieces' },
      text: { th: 'ขุนเดี่ยวสู้กับม้าสองตัว (ไม่มีเรือหรือโคน) นับได้กี่ตา?', en: 'A lone Khun against two Ma (no Ruea or Khon) may count how many moves?' },
      choices: [moves(32), moves(44), moves(16)],
      correct: 0,
    },
    {
      kind: 'quiz',
      verify: { fen: START, move: 'e3e4', limitMoves: 0 },
      text: { th: 'ถ้ายังมีเบี้ยเหลืออยู่บนกระดาน ต้องนับศักดิ์หรือไม่?', en: 'If any Bia are still on the board, does counting apply?' },
      choices: [
        { th: 'ต้องนับ', en: 'Yes' },
        { th: 'ไม่ต้องนับ', en: 'No' },
      ],
      correct: 1,
    },
  ],
};

const guided: Lesson = {
  id: 'guided',
  icon: 'game',
  title: { th: 'เกมแรกพร้อมโค้ช', en: 'First game with a coach' },
  summary: { th: 'เล่นกับน้องเบี้ยพร้อมคำแนะนำ', en: 'Play Little Bia with tips' },
  xp: 20,
  route: '/play/guided',
  steps: [],
};

export const UNITS: Unit[] = [
  { id: 'basics', title: { th: 'พื้นฐาน: หมากแต่ละตัว', en: 'Basics: the pieces' }, lessons: [board, khun, met, khon, ma, ruea, bia] },
  { id: 'rules', title: { th: 'กติกาสำคัญ', en: 'Key rules' }, lessons: [promotion, check, checkmate, counting] },
  { id: 'play', title: { th: 'ลงสนามจริง', en: 'Time to play' }, lessons: [guided] },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);

export const findLesson = (id: string | undefined): Lesson | undefined => ALL_LESSONS.find((l) => l.id === id);
