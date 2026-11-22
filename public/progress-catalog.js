// Launch dungeon names and Horde unlock chains are cross-checked against
// Blizzard's Forever dungeon guide and the sources linked from the Progress page.
export const dungeons = [
  ["hall-of-thanes", "Hall of Thanes", "13–18"], ["ragefire-chasm", "Ragefire Chasm", "13–18"],
  ["ruins-of-lordaeron", "Ruins of Lordaeron", "15–20"], ["wailing-caverns", "Wailing Caverns", "15–25"],
  ["deadmines", "The Deadmines", "18–23"], ["shadowfang-keep", "Shadowfang Keep", "22–30"],
  ["stockade", "The Stockade", "22–30"], ["excavation-site", "Excavation Site", "24–29"],
  ["blackfathom-deeps", "Blackfathom Deeps", "24–32"], ["city-of-dalaran", "City of Dalaran", "28–33"],
  ["scarlet-graveyard", "Scarlet Monastery: Graveyard", "28–45"], ["scarlet-library", "Scarlet Monastery: Library", "28–45"],
  ["scarlet-armory", "Scarlet Monastery: Armory", "28–45"], ["scarlet-cathedral", "Scarlet Monastery: Cathedral", "28–45"],
  ["gnomeregan", "Gnomeregan", "29–38"], ["razorfen-kraul", "Razorfen Kraul", "30–40"],
  ["drowned-city", "The Drowned City", "35–40"], ["kroldok-stronghold", "Krol'dok Stronghold", "40–45"],
  ["razorfen-downs", "Razorfen Downs", "40–50"], ["uldaman", "Uldaman", "42–52"],
  ["zulfarrak", "Zul'Farrak", "44–54"], ["maraudon", "Maraudon", "45–57"],
  ["alcaz-prison", "Alcaz Prison", "48–53"], ["sunken-temple", "Sunken Temple", "50–60"],
  ["blackrock-depths", "Blackrock Depths", "52–60"], ["blackmaw-hold", "Blackmaw Hold", "55–60"],
  ["lower-blackrock-spire", "Lower Blackrock Spire", "55–60"], ["shapers-terrace", "Shaper's Terrace", "58–60"],
  ["upper-blackrock-spire", "Upper Blackrock Spire", "58–60"], ["scholomance", "Scholomance", "58–60"],
  ["stratholme-live", "Stratholme: Live", "58–60"], ["stratholme-undead", "Stratholme: Undead", "58–60"],
  ["dire-maul-east", "Dire Maul: East", "58–60"], ["dire-maul-west", "Dire Maul: West", "58–60"],
  ["dire-maul-north", "Dire Maul: North", "58–60"]
].map(([id, name, levels]) => ({ id, name, levels }));

export const unlocks = [
  ["dalaran-horde", "City of Dalaran", "Dalaran Sewer Key", [
    "Prison Break-In", "Key to the City", "Dalaran Patrols", "Blood in the Streets", "Heart of Disruption", "Shrewd Negotiations"
  ]],
  ["onyxia-horde", "Onyxia’s Lair", "Drakefire Amulet", [
    "Blood and Thunder", "Warlord's Command", "Eitrigg's Wisdom", "For The Horde!", "What the Wind Carries",
    "The Champion of the Horde", "The Testament of Rexxar", "Oculus Illusions", "Emberstrife",
    "The Test of Skulls, Scryer", "The Test of Skulls, Somnus", "The Test of Skulls, Chronalis", "The Test of Skulls, Axtroz",
    "Ascension...", "Blood of the Black Dragon Champion"
  ]],
  ["upper-blackrock-spire", "Upper Blackrock Spire", "Seal of Ascension", ["Seal of Ascension (collect the gems)", "Seal of Ascension (forge the seal)"]],
  ["scholomance-horde", "Scholomance", "Skeleton Key", [
    "A Call to Arms: The Plaguelands!", "Scholomance", "Skeletal Fragments", "Mold Rhymes With...",
    "Fire Plume Forged", "Araj's Scarab", "The Key to Scholomance"
  ]],
  ["maraudon", "Maraudon shortcut", "Scepter of Celebras", ["Legends of Maraudon", "The Scepter of Celebras"]],
  ["blackrock-depths", "Blackrock Depths doors", "Shadowforge Key", ["Dark Iron Legacy"]],
  ["molten-core", "Molten Core", "Attunement to the Core", ["Attunement to the Core"]],
  ["blackwing-lair", "Blackwing Lair", "Orb of Command", ["Blackhand's Command"]]
].map(([id, name, reward, steps]) => ({ id, name, reward, steps: steps.map((name, index) => ({ id: `${id}-${index + 1}`, name })) }));

export const dungeonById = new Map(dungeons.map(dungeon => [dungeon.id, dungeon]));
export const unlockStepIds = new Set(unlocks.flatMap(unlock => unlock.steps.map(step => step.id)));
export const roles = ["Tank", "Healer", "DPS"];
export const rsvpStatuses = ["Going", "Maybe", "Declined"];
