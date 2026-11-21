export const demoMembers = [
  { id: 101, slug: "tharok-ironhide", name: "Tharok Ironhide", className: "Warrior", race: "Orc", level: 60, rank: 0 },
  { id: 102, slug: "veshra-blackthorn", name: "Veshra Blackthorn", className: "Rogue", race: "Undead", level: 60, rank: 1 },
  { id: 103, slug: "kaela-emberveil", name: "Kaela Emberveil", className: "Mage", race: "Troll", level: 60, rank: 1 },
  { id: 104, slug: "grum-stormcaller", name: "Grum Stormcaller", className: "Shaman", race: "Tauren", level: 60, rank: 2 },
  { id: 105, slug: "zarek-deadeye", name: "Zarek Deadeye", className: "Hunter", race: "Troll", level: 60, rank: 2 },
  { id: 106, slug: "mogra-ashbinder", name: "Mogra Ashbinder", className: "Warlock", race: "Orc", level: 58, rank: 2 },
  { id: 107, slug: "selka-gravewhisper", name: "Selka Gravewhisper", className: "Priest", race: "Undead", level: 54, rank: 3 },
  { id: 108, slug: "vrann-moonhoof", name: "Vrann Moonhoof", className: "Druid", race: "Tauren", level: 47, rank: 3 }
];

export const demoReports = [
  { id: "sample-a", characterId: 102, dps: 1247.6, scenario: "Single target · 5 min", date: "2026-11-19T21:00:00Z" },
  { id: "sample-b", characterId: 103, dps: 1182.2, scenario: "Single target · 5 min", date: "2026-11-18T21:00:00Z" },
  { id: "sample-c", characterId: 101, dps: 1126.4, scenario: "Single target · 5 min", date: "2026-11-17T21:00:00Z" },
  { id: "sample-d", characterId: 105, dps: 984.3, scenario: "Single target · 5 min", date: "2026-11-16T21:00:00Z" },
  { id: "sample-e", characterId: 102, dps: 1195.5, scenario: "Single target · 5 min", date: "2026-11-13T21:00:00Z" }
];

const sampleBuilds = {
  Warrior: ["Fury", "Cruelty", "Flurry", "Blacksmithing", "Mining", "Ironhide Battlehelm"],
  Rogue: ["Combat", "Precision", "Blade Flurry", "Engineering", "Mining", "Blackthorn Hood"],
  Mage: ["Frost", "Ice Shards", "Cold Snap", "Tailoring", "Enchanting", "Emberveil Crown"],
  Shaman: ["Enhancement", "Thundering Strikes", "Flurry", "Alchemy", "Herbalism", "Stormcaller Helm"],
  Hunter: ["Marksmanship", "Lethal Shots", "Aimed Shot", "Leatherworking", "Skinning", "Deadeye Coif"],
  Warlock: ["Affliction", "Improved Corruption", "Nightfall", "Tailoring", "Enchanting", "Ashbinder Cowl"],
  Priest: ["Holy", "Holy Specialization", "Inspiration", "Alchemy", "Herbalism", "Gravewhisper Circlet"],
  Druid: ["Feral Combat", "Ferocity", "Sharpened Claws", "Leatherworking", "Skinning", "Moonhoof Helm"]
};

export function demoCharacter(slug) {
  const member = demoMembers.find(character => character.slug === slug);
  if (!member) return null;
  const [tree, basicTalent, advancedTalent, primary, secondary, item] = sampleBuilds[member.className];
  return {
    ...member,
    updatedAt: "2026-11-19T21:00:00Z",
    itemLevel: 59,
    gear: [
      { slot: "Head", name: item, level: 61, quality: "RARE" },
      { slot: "Neck", name: "Pendant of the Vanguard", level: 58, quality: "UNCOMMON" },
      { slot: "Shoulders", name: "Dark Iron Mantle", level: 59, quality: "RARE" },
      { slot: "Chest", name: "Blacksteel Warplate", level: 60, quality: "RARE" },
      { slot: "Hands", name: "Emberguard Grips", level: 57, quality: "UNCOMMON" },
      { slot: "Feet", name: "Ashen Pathfinders", level: 59, quality: "RARE" }
    ],
    talents: [
      { name: tree, points: 6, talents: [{ name: basicTalent, rank: 5 }, { name: advancedTalent, rank: 1 }] }
    ],
    professions: [
      { name: primary, current: 260, max: 300, group: "Primary" },
      { name: secondary, current: 285, max: 300, group: "Primary" },
      { name: "First Aid", current: 150, max: 225, group: "Secondary" }
    ]
  };
}
