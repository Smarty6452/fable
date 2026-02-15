export interface Mission {
  id: string;
  word: string;
  sound: string;
  emoji: string;
  difficulty: "easy" | "medium" | "hard";
  tip: string;
  example: string;
}

export const MISSIONS: Mission[] = [
  // Chapter 1: Sound Explorer (Easy basics)
  { id: "1", word: "Sun", sound: "S", emoji: "☀️", difficulty: "easy", tip: "Put your tongue behind your top teeth and blow air softly!", example: "Ssssun - like a snake hissing!" },
  { id: "2", word: "Cake", sound: "C", emoji: "🍰", difficulty: "easy", tip: "Touch the back of your tongue to the roof of your mouth!", example: "K-k-cake - like a clock ticking!" },
  { id: "6", word: "Apple", sound: "P", emoji: "🍎", difficulty: "easy", tip: "Press your lips together, then pop them open!", example: "A-ppp-le - pop those lips!" },
  { id: "8", word: "Fish", sound: "F", emoji: "🐟", difficulty: "easy", tip: "Gently bite your bottom lip and blow air!", example: "Fff-ish - lip under teeth, blow!" },
  // Chapter 2: Brave Voyager (Medium sounds)
  { id: "3", word: "Lion", sound: "L", emoji: "🦁", difficulty: "medium", tip: "Press your tongue tip right behind your top front teeth!", example: "Lll-ion - let your tongue tap up!" },
  { id: "4", word: "Robot", sound: "R", emoji: "🤖", difficulty: "medium", tip: "Curl your tongue back slightly without touching anything!", example: "Rrr-obot - like a quiet growl!" },
  { id: "5", word: "Water", sound: "W", emoji: "💧", difficulty: "medium", tip: "Round your lips like you're about to blow a candle!", example: "Www-ater - round lips, then open!" },
  // Chapter 3: Sound Master (Hard sounds)
  { id: "7", word: "Thunder", sound: "TH", emoji: "⚡", difficulty: "hard", tip: "Put your tongue between your teeth just a little bit!", example: "Th-th-thunder - tongue peeks out!" },
  { id: "9", word: "Zebra", sound: "Z", emoji: "🦓", difficulty: "medium", tip: "Make a bee sound! Zzzzz!", example: "Zzz-ebra - feel the buzz in your teeth!" },
  { id: "12", word: "Shark", sound: "SH", emoji: "🦈", difficulty: "medium", tip: "Round your lips and say 'shhh'!", example: "Shhh-ark - like telling someone to be quiet!" },
  // Chapter 4: Combo Champion (Blends & combos)
  { id: "13", word: "Star", sound: "ST", emoji: "⭐", difficulty: "medium", tip: "Start with S then quickly add T - Sss-tar!", example: "St-st-star - snake hiss then tongue tap!" },
  { id: "14", word: "Frog", sound: "FR", emoji: "🐸", difficulty: "medium", tip: "Bite your lip for F then growl the R!", example: "Fff-rrr-og - lip bite then growl!" },
  { id: "15", word: "Snail", sound: "SN", emoji: "🐌", difficulty: "medium", tip: "Hiss the S then hum the N through your nose!", example: "Sss-nnn-ail - hiss then hum!" },
  { id: "16", word: "Clap", sound: "CL", emoji: "👏", difficulty: "hard", tip: "Quick K sound then tongue up for L!", example: "Cl-cl-clap - back tongue then front!" },
  // Chapter 5: Word Wizard (Multi-syllable)
  { id: "17", word: "Butterfly", sound: "B", emoji: "🦋", difficulty: "medium", tip: "Pop your lips for B, then let the word flow!", example: "But-ter-fly - three beats!" },
  { id: "18", word: "Dinosaur", sound: "D", emoji: "🦕", difficulty: "medium", tip: "Tap your tongue behind your top teeth for D!", example: "Di-no-saur - tongue tap then roar!" },
  { id: "19", word: "Elephant", sound: "L", emoji: "🐘", difficulty: "hard", tip: "E-le-phant has three parts - focus on the L in the middle!", example: "El-e-phant - tongue up for that L!" },
  { id: "20", word: "Helicopter", sound: "H", emoji: "🚁", difficulty: "hard", tip: "Breathe out softly for H, then say each part!", example: "Hel-i-cop-ter - four beats, blow air first!" },
  // Chapter 6: Sentence Sage (Short phrases)
  { id: "10", word: "Monkey", sound: "M", emoji: "🐒", difficulty: "easy", tip: "Keep your lips closed and hum!", example: "Mmm-onkey - like you're eating something yummy!" },
  { id: "11", word: "Goat", sound: "G", emoji: "🐐", difficulty: "easy", tip: "Make a sound in the back of your throat!", example: "G-g-goat - like gulping water!" },
  { id: "21", word: "Thank you", sound: "TH", emoji: "🙏", difficulty: "hard", tip: "Put your tongue between your teeth just a little bit!", example: "Th-ank you - tongue peeks out then smile!" },
  { id: "22", word: "Please help", sound: "PL", emoji: "🆘", difficulty: "hard", tip: "Pop your P then quickly lift tongue for L!", example: "Pl-ease help - pop then lift!" },
];
