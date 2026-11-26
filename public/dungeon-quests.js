// Quest IDs and names are sourced from Wowhead's Forever dungeon guides.
// Guides may be revised; link through to Wowhead for the latest quest requirements.
// Alliance-only IDs from Forever quest race masks. Unrestricted and unclassified IDs remain available.
const allianceOnlyQuestIds = new Set([
  17, 65, 166, 167, 168, 203, 204, 205, 214, 261,
  275, 276, 277, 303, 373, 377, 378, 386, 387, 388,
  391, 463, 484, 704, 707, 720, 722, 723, 724, 725,
  726, 738, 739, 762, 971, 1050, 1052, 1053, 1100, 1101,
  1139, 1142, 1199, 1200, 1275, 1360, 1448, 1449, 1450, 1451,
  1452, 1469, 1475, 1654, 1701, 2040, 2198, 2199, 2200, 2201,
  2204, 2240, 2398, 2439, 2500, 2501, 2922, 2924, 2926, 2928,
  2929, 2930, 2947, 2948, 2962, 2988, 2991, 2994, 3445, 3636,
  3701, 3702, 3765, 4126, 4128, 4141, 4142, 4143, 4182, 4241,
  4262, 4263, 4282, 4286, 4322, 4341, 4342, 4361, 4362, 4363,
  4701, 4764, 4765, 4766, 5001, 5002, 5066, 5081, 5089, 5092,
  5097, 5102, 5343, 5505, 5533, 5537, 5538, 5801, 5803, 6141,
  6502, 7041, 7065, 7070, 7462, 7482, 7488, 8922, 92344, 92415,
  92432, 92456, 92457, 92458, 92489, 92742, 92753, 95189, 95194, 95195,
  95250, 95262, 95263, 95264, 95646, 95647, 95737, 95772, 95787, 95788,
  95798, 95799, 95809, 95810, 96381, 96391, 96393, 96394, 96403, 96772,
  96773, 96800, 97130, 97173, 98423, 98815, 98824
]);

const rawDungeonQuestCatalog = [
  {
    "dungeonId": "hall-of-thanes",
    "guideId": 34887,
    "guideName": "The Hall of Thanes Dungeon Overview Guide:  Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/hall-of-thanes-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 96403,
        "name": "Important Heirlooms"
      },
      {
        "id": 96394,
        "name": "The Restless Dead"
      },
      {
        "id": 96393,
        "name": "Old Ironforge Incursion"
      },
      {
        "id": 96391,
        "name": "Underground Map"
      },
      {
        "id": 98423,
        "name": "The Treaty of Understanding"
      },
      {
        "id": 96395,
        "name": "An Ancient Grudge"
      }
    ]
  },
  {
    "dungeonId": "ragefire-chasm",
    "guideId": 34928,
    "guideName": "Ragefire Chasm Dungeon Overview Guide:  Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/ragefire-chasm-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 5761,
        "name": "Slaying the Beast"
      },
      {
        "id": 5725,
        "name": "The Power to Destroy..."
      },
      {
        "id": 5723,
        "name": "Testing an Enemy's Strength"
      },
      {
        "id": 5724,
        "name": "Returning the Lost Satchel"
      },
      {
        "id": 5722,
        "name": "Searching for the Lost Satchel"
      },
      {
        "id": 5728,
        "name": "Hidden Enemies"
      },
      {
        "id": 5726,
        "name": "Hidden Enemies"
      }
    ]
  },
  {
    "dungeonId": "ruins-of-lordaeron",
    "guideId": 34931,
    "guideName": "Ruins of Lordaeron Overview Guide:  Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/ruins-of-lordaeron-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 92422,
        "name": "The Wrath of Rath'mael"
      },
      {
        "id": 99156,
        "name": "Rear Guard Patrol"
      },
      {
        "id": 92401,
        "name": "A Frightened Request"
      },
      {
        "id": 92421,
        "name": "Light's Justice"
      },
      {
        "id": 95216,
        "name": "The New Plague"
      },
      {
        "id": 451,
        "name": "A Recipe For Death"
      },
      {
        "id": 97288,
        "name": "Unending Torment"
      },
      {
        "id": 95204,
        "name": "Crest of Lordaeron"
      },
      {
        "id": 95189,
        "name": "Crest of Lordaeron"
      },
      {
        "id": 95250,
        "name": "Abominable Creatures"
      },
      {
        "id": 95195,
        "name": "Bloodied Insignia"
      },
      {
        "id": 92415,
        "name": "Remember That I Love You"
      }
    ]
  },
  {
    "dungeonId": "wailing-caverns",
    "guideId": 34961,
    "guideName": "Wailing Caverns Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/wailing-caverns-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 962,
        "name": "Serpentbloom"
      },
      {
        "id": 1491,
        "name": "Smart Drinks"
      },
      {
        "id": 865,
        "name": "Raptor Horns"
      },
      {
        "id": 959,
        "name": "Trouble at the Docks"
      },
      {
        "id": 1486,
        "name": "Deviate Hides"
      },
      {
        "id": 1487,
        "name": "Deviate Eradication"
      },
      {
        "id": 6981,
        "name": "The Glowing Shard"
      },
      {
        "id": 914,
        "name": "Leaders of the Fang"
      },
      {
        "id": 870,
        "name": "The Forgotten Pools"
      },
      {
        "id": 3369,
        "name": "In Nightmares"
      }
    ]
  },
  {
    "dungeonId": "deadmines",
    "guideId": 34929,
    "guideName": "The Deadmines Dungeon Strategy Guide - WoW: Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/the-deadmines-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 168,
        "name": "Collecting Memories"
      },
      {
        "id": 167,
        "name": "Oh Brother..."
      },
      {
        "id": 2040,
        "name": "Underground Assault"
      },
      {
        "id": 373,
        "name": "The Unsent Letter"
      },
      {
        "id": 391,
        "name": "The Stockade Riots"
      },
      {
        "id": 214,
        "name": "Red Silk Bandanas"
      },
      {
        "id": 166,
        "name": "The Defias Brotherhood"
      },
      {
        "id": 92753,
        "name": "Destruction in Deadmines"
      },
      {
        "id": 92742,
        "name": "Testing the Wells"
      },
      {
        "id": 1654,
        "name": "The Test of Righteousness"
      },
      {
        "id": 95036,
        "name": "A Moon-Kissed Blade"
      },
      {
        "id": 65,
        "name": "The Defias Brotherhood"
      }
    ]
  },
  {
    "dungeonId": "shadowfang-keep",
    "guideId": 34930,
    "guideName": "Shadowfang Keep Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/shadowfang-keep-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 1013,
        "name": "The Book of Ur"
      },
      {
        "id": 1098,
        "name": "Deathstalkers in Shadowfang"
      },
      {
        "id": 1014,
        "name": "Arugal Must Die"
      },
      {
        "id": 1740,
        "name": "The Orb of Soran'ruk"
      },
      {
        "id": 1654,
        "name": "The Test of Righteousness"
      },
      {
        "id": 95036,
        "name": "A Moon-Kissed Blade"
      },
      {
        "id": 91858,
        "name": "Diplomatic Incident"
      }
    ]
  },
  {
    "dungeonId": "stockade",
    "guideId": 34935,
    "guideName": "The Stockade Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/the-stockade-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 387,
        "name": "Quell the Uprising"
      },
      {
        "id": 388,
        "name": "The Color of Blood"
      },
      {
        "id": 377,
        "name": "Crime and Punishment"
      },
      {
        "id": 386,
        "name": "What Comes Around..."
      },
      {
        "id": 378,
        "name": "The Fury Runs Deep"
      },
      {
        "id": 303,
        "name": "The Dark Iron War"
      },
      {
        "id": 391,
        "name": "The Stockade Riots"
      },
      {
        "id": 373,
        "name": "The Unsent Letter"
      }
    ]
  },
  {
    "dungeonId": "excavation-site",
    "guideId": 34967,
    "guideName": "Excavation Site Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/excavation-site-wetlands-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 98815,
        "name": "Highland Hides"
      },
      {
        "id": 484,
        "name": "Young Crocolisk Skins"
      },
      {
        "id": 95772,
        "name": "Songblade Search"
      },
      {
        "id": 95646,
        "name": "Horrors in the Highland"
      },
      {
        "id": 463,
        "name": "The Greenwarden"
      },
      {
        "id": 95647,
        "name": "Lost in the Thicket Things"
      },
      {
        "id": 95737,
        "name": "Seeking Caitlin"
      },
      {
        "id": 95809,
        "name": "Heartwoven"
      },
      {
        "id": 95810,
        "name": "Lost Relic Carry"
      },
      {
        "id": 98824,
        "name": "Prehistoric Prism"
      },
      {
        "id": 95697,
        "name": "Changing Tastes"
      },
      {
        "id": 95664,
        "name": "Elder Knowledge"
      },
      {
        "id": 98823,
        "name": "Earthen Echo"
      },
      {
        "id": 95682,
        "name": "Open the Maw"
      },
      {
        "id": 95663,
        "name": "Dragonmaw Rumors"
      },
      {
        "id": 96393,
        "name": "Old Ironforge Incursion"
      },
      {
        "id": 276,
        "name": "Tramping Paws"
      },
      {
        "id": 277,
        "name": "Fire Taboo"
      },
      {
        "id": 275,
        "name": "Blisters on the Land"
      }
    ]
  },
  {
    "dungeonId": "blackfathom-deeps",
    "guideId": 34933,
    "guideName": "Blackfathom Deeps Dungeon Overview Guide:  Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/blackfathom-deeps-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 6563,
        "name": "The Essence of Aku'Mai"
      },
      {
        "id": 6561,
        "name": "Blackfathom Villainy"
      },
      {
        "id": 6921,
        "name": "Amongst the Ruins"
      },
      {
        "id": 6922,
        "name": "Baron Aquanis"
      },
      {
        "id": 1740,
        "name": "The Orb of Soran'ruk"
      },
      {
        "id": 6565,
        "name": "Allegiance to the Old Gods"
      },
      {
        "id": 971,
        "name": "Knowledge in the Deeps"
      },
      {
        "id": 1275,
        "name": "Researching the Corruption"
      },
      {
        "id": 1199,
        "name": "Twilight Falls"
      },
      {
        "id": 1198,
        "name": "In Search of Thaelrid"
      },
      {
        "id": 1200,
        "name": "Blackfathom Villainy"
      },
      {
        "id": 1654,
        "name": "The Test of Righteousness"
      },
      {
        "id": 3765,
        "name": "The Corruption Abroad"
      },
      {
        "id": 6562,
        "name": "Trouble in the Deeps"
      }
    ]
  },
  {
    "dungeonId": "city-of-dalaran",
    "guideId": 34964,
    "guideName": "City of Dalaran Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/city-of-dalaran-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 544,
        "name": "Prison Break In"
      },
      {
        "id": 93680,
        "name": "Key to the City"
      },
      {
        "id": 545,
        "name": "Dalaran Patrols"
      },
      {
        "id": 92434,
        "name": "Blood in the Streets"
      },
      {
        "id": 96984,
        "name": "Heart of Disruption"
      },
      {
        "id": 96986,
        "name": "The Grave Knight"
      },
      {
        "id": 96988,
        "name": "Source of Power"
      },
      {
        "id": 96987,
        "name": "Opportunistic Education"
      },
      {
        "id": 92489,
        "name": "Power Overwhelming"
      },
      {
        "id": 92458,
        "name": "Heart of Disruption"
      },
      {
        "id": 92432,
        "name": "An Alarming Request"
      },
      {
        "id": 92456,
        "name": "A Green Sample"
      },
      {
        "id": 92457,
        "name": "Starving Arcane"
      },
      {
        "id": 1200,
        "name": "Blackfathom Villainy"
      },
      {
        "id": 6561,
        "name": "Blackfathom Villainy"
      },
      {
        "id": 971,
        "name": "Knowledge in the Deeps"
      },
      {
        "id": 6565,
        "name": "Allegiance to the Old Gods"
      },
      {
        "id": 6922,
        "name": "Baron Aquanis"
      }
    ]
  },
  {
    "dungeonId": "scarlet-graveyard",
    "guideId": 34948,
    "guideName": "Scarlet Monastery: Graveyard Dungeon Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/scarlet-monastery-graveyard-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 1048,
        "name": "Into The Scarlet Monastery"
      },
      {
        "id": 1051,
        "name": "Vorrel's Revenge"
      },
      {
        "id": 1113,
        "name": "Hearts of Zeal"
      },
      {
        "id": 1109,
        "name": "Going, Going, Guano!"
      },
      {
        "id": 1053,
        "name": "In the Name of the Light"
      },
      {
        "id": 6141,
        "name": "Brother Anton"
      },
      {
        "id": 261,
        "name": "Down the Scarlet Path"
      },
      {
        "id": 1052,
        "name": "Down the Scarlet Path"
      }
    ]
  },
  {
    "dungeonId": "scarlet-library",
    "guideId": 34954,
    "guideName": "Scarlet Monastery: Library Dungeon Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/scarlet-monastery-library-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 1053,
        "name": "In the Name of the Light"
      },
      {
        "id": 6141,
        "name": "Brother Anton"
      },
      {
        "id": 1113,
        "name": "Hearts of Zeal"
      },
      {
        "id": 1109,
        "name": "Going, Going, Guano!"
      },
      {
        "id": 1049,
        "name": "Compendium of the Fallen"
      },
      {
        "id": 1160,
        "name": "Test of Lore"
      },
      {
        "id": 1149,
        "name": "Test of Faith"
      },
      {
        "id": 1048,
        "name": "Into The Scarlet Monastery"
      },
      {
        "id": 1050,
        "name": "Mythology of the Titans"
      },
      {
        "id": 96800,
        "name": "Past Due"
      },
      {
        "id": 1951,
        "name": "Rituals of Power"
      },
      {
        "id": 1947,
        "name": "Journey to the Marsh"
      },
      {
        "id": 261,
        "name": "Down the Scarlet Path"
      },
      {
        "id": 1052,
        "name": "Down the Scarlet Path"
      },
      {
        "id": 1150,
        "name": "Test of Endurance"
      },
      {
        "id": 1151,
        "name": "Test of Strength"
      },
      {
        "id": 1152,
        "name": "Test of Lore"
      },
      {
        "id": 1154,
        "name": "Test of Lore"
      },
      {
        "id": 6627,
        "name": "Test of Lore"
      },
      {
        "id": 1159,
        "name": "Test of Lore"
      },
      {
        "id": 6628,
        "name": "Test of Lore"
      },
      {
        "id": 1394,
        "name": "Final Passage"
      },
      {
        "id": 1949,
        "name": "Hidden Secrets"
      },
      {
        "id": 1950,
        "name": "Get the Scoop"
      }
    ]
  },
  {
    "dungeonId": "scarlet-armory",
    "guideId": 34953,
    "guideName": "Scarlet Monastery: Armory Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/scarlet-monastery-armory-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 1048,
        "name": "Into The Scarlet Monastery"
      },
      {
        "id": 1113,
        "name": "Hearts of Zeal"
      },
      {
        "id": 1109,
        "name": "Going, Going, Guano!"
      },
      {
        "id": 1053,
        "name": "In the Name of the Light"
      },
      {
        "id": 6141,
        "name": "Brother Anton"
      },
      {
        "id": 261,
        "name": "Down the Scarlet Path"
      },
      {
        "id": 1052,
        "name": "Down the Scarlet Path"
      }
    ]
  },
  {
    "dungeonId": "scarlet-cathedral",
    "guideId": 34952,
    "guideName": "Scarlet Monastery: Cathedral Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/scarlet-monastery-cathedral-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 1048,
        "name": "Into The Scarlet Monastery"
      },
      {
        "id": 1053,
        "name": "In the Name of the Light"
      },
      {
        "id": 6141,
        "name": "Brother Anton"
      },
      {
        "id": 261,
        "name": "Down the Scarlet Path"
      },
      {
        "id": 1052,
        "name": "Down the Scarlet Path"
      }
    ]
  },
  {
    "dungeonId": "gnomeregan",
    "guideId": 34937,
    "guideName": "Gnomeregan Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/gnomeregan-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 2842,
        "name": "Chief Engineer Scooty"
      },
      {
        "id": 2843,
        "name": "Gnomer-gooooone!"
      },
      {
        "id": 2841,
        "name": "Rig Wars"
      },
      {
        "id": 2922,
        "name": "Save Techbot's Brain!"
      },
      {
        "id": 2928,
        "name": "Gyrodrillmatic Excavationators"
      },
      {
        "id": 2924,
        "name": "Essential Artificials"
      },
      {
        "id": 2930,
        "name": "Data Rescue"
      },
      {
        "id": 2929,
        "name": "The Grand Betrayal"
      },
      {
        "id": 2926,
        "name": "Gnogaine"
      },
      {
        "id": 2962,
        "name": "The Only Cure is More Green Glow"
      },
      {
        "id": 2951,
        "name": "The Sparklematic 5200!"
      },
      {
        "id": 2904,
        "name": "A Fine Mess"
      },
      {
        "id": 2945,
        "name": "Grime-Encrusted Ring"
      },
      {
        "id": 2947,
        "name": "Return of the Ring"
      },
      {
        "id": 2949,
        "name": "Return of the Ring"
      },
      {
        "id": 2948,
        "name": "Gnome Improvement"
      },
      {
        "id": 2950,
        "name": "Nogg's Ring Redo"
      }
    ]
  },
  {
    "dungeonId": "razorfen-kraul",
    "guideId": 34942,
    "guideName": "Razorfen Kraul Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/razerfen-kraul-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 1102,
        "name": "A Vengeful Fate"
      },
      {
        "id": 1109,
        "name": "Going, Going, Guano!"
      },
      {
        "id": 1113,
        "name": "Hearts of Zeal"
      },
      {
        "id": 6522,
        "name": "An Unholy Alliance"
      },
      {
        "id": 6521,
        "name": "An Unholy Alliance"
      },
      {
        "id": 1101,
        "name": "The Crone of the Kraul"
      },
      {
        "id": 1100,
        "name": "Lonebrow's Journal"
      },
      {
        "id": 1142,
        "name": "Mortality Wanes"
      },
      {
        "id": 1221,
        "name": "Blueleaf Tubers"
      },
      {
        "id": 1144,
        "name": "Willix the Importer"
      },
      {
        "id": 1838,
        "name": "Brutal Armor"
      },
      {
        "id": 1701,
        "name": "Fire Hardened Mail"
      }
    ]
  },
  {
    "dungeonId": "drowned-city",
    "guideId": 35328,
    "guideName": "The Drowned City Overview Guide:  Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/the-drowned-city-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 95788,
        "name": "Magics of the Drowned City"
      },
      {
        "id": 95798,
        "name": "The Web of Magic"
      },
      {
        "id": 203,
        "name": "The Second Rebellion"
      },
      {
        "id": 204,
        "name": "Bad Medicine"
      },
      {
        "id": 205,
        "name": "Troll Witchery"
      },
      {
        "id": 95787,
        "name": "Take Two With Water"
      },
      {
        "id": 95799,
        "name": "Findings for the Explorer's League"
      },
      {
        "id": 97130,
        "name": "Ancient Gurubashi Secrets"
      },
      {
        "id": 95775,
        "name": "The Drowned City"
      },
      {
        "id": 629,
        "name": "The Vile Reef"
      },
      {
        "id": 95776,
        "name": "The Only Good Brinescale..."
      },
      {
        "id": 95773,
        "name": "Enemies in the Water"
      },
      {
        "id": 96774,
        "name": "Ancient Gurubashi Idol"
      },
      {
        "id": 95789,
        "name": "Shady Saltseers"
      },
      {
        "id": 95791,
        "name": "The Saltseer Captain"
      },
      {
        "id": 92422,
        "name": "The Wrath of Rath'mael"
      },
      {
        "id": 92401,
        "name": "A Frightened Request"
      }
    ]
  },
  {
    "dungeonId": "razorfen-downs",
    "guideId": 34945,
    "guideName": "Razorfen Downs Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/razorfen-downs-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 97196,
        "name": "The Coldbringer's Eye"
      },
      {
        "id": 3341,
        "name": "Bring the End"
      },
      {
        "id": 6521,
        "name": "An Unholy Alliance"
      },
      {
        "id": 6522,
        "name": "An Unholy Alliance"
      },
      {
        "id": 3636,
        "name": "Bring the Light"
      },
      {
        "id": 96773,
        "name": "The Coldbringer's Eye"
      },
      {
        "id": 6626,
        "name": "A Host of Evil"
      },
      {
        "id": 3523,
        "name": "Scourge of the Downs"
      },
      {
        "id": 3525,
        "name": "Extinguishing the Idol"
      }
    ]
  },
  {
    "dungeonId": "uldaman",
    "guideId": 34966,
    "guideName": "Uldaman Dungeon Strategy Guide - WoW: Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/uldaman-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 2342,
        "name": "Reclaimed Treasures"
      },
      {
        "id": 2202,
        "name": "Uldaman Reagent Run"
      },
      {
        "id": 2258,
        "name": "Badlands Reagent Run"
      },
      {
        "id": 2283,
        "name": "Necklace Recovery"
      },
      {
        "id": 1360,
        "name": "Reclaimed Treasures"
      },
      {
        "id": 2398,
        "name": "The Lost Dwarves"
      },
      {
        "id": 2240,
        "name": "The Hidden Chamber"
      },
      {
        "id": 17,
        "name": "Uldaman Reagent Run"
      },
      {
        "id": 2500,
        "name": "Badlands Reagent Run"
      },
      {
        "id": 704,
        "name": "Agmond's Fate"
      },
      {
        "id": 707,
        "name": "Ironband Wants You!"
      },
      {
        "id": 1139,
        "name": "The Lost Tablets of Will"
      },
      {
        "id": 720,
        "name": "A Sign of Hope"
      },
      {
        "id": 2198,
        "name": "The Shattered Necklace"
      },
      {
        "id": 2418,
        "name": "Power Stones"
      },
      {
        "id": 709,
        "name": "Solution to Doom"
      },
      {
        "id": 2278,
        "name": "The Platinum Discs"
      },
      {
        "id": 1956,
        "name": "Power in Uldaman"
      },
      {
        "id": 1953,
        "name": "Return to the Marsh"
      },
      {
        "id": 2439,
        "name": "The Platinum Discs"
      },
      {
        "id": 2440,
        "name": "The Platinum Discs"
      },
      {
        "id": 1954,
        "name": "The Infernal Orb"
      },
      {
        "id": 1955,
        "name": "The Exorcism"
      },
      {
        "id": 722,
        "name": "Amulet of Secrets"
      },
      {
        "id": 723,
        "name": "Prospect of Faith"
      },
      {
        "id": 724,
        "name": "Prospect of Faith"
      },
      {
        "id": 2501,
        "name": "Badlands Reagent Run II"
      },
      {
        "id": 738,
        "name": "Find Agmond"
      },
      {
        "id": 739,
        "name": "Murdaloc"
      },
      {
        "id": 725,
        "name": "Passing Word of a Threat"
      },
      {
        "id": 726,
        "name": "Passing Word of a Threat"
      },
      {
        "id": 762,
        "name": "An Ambassador of Evil"
      },
      {
        "id": 2204,
        "name": "Restoring the Necklace"
      },
      {
        "id": 2199,
        "name": "Lore for a Price"
      },
      {
        "id": 2200,
        "name": "Back to Uldaman"
      },
      {
        "id": 2201,
        "name": "Find the Gems"
      },
      {
        "id": 2203,
        "name": "Badlands Reagent Run II"
      },
      {
        "id": 2341,
        "name": "Necklace Recovery, Take 3"
      },
      {
        "id": 2284,
        "name": "Necklace Recovery, Take 2"
      },
      {
        "id": 2339,
        "name": "Find the Gems and Power Source"
      },
      {
        "id": 2340,
        "name": "Deliver the Gems"
      },
      {
        "id": 2431,
        "name": ""
      }
    ]
  },
  {
    "dungeonId": "zulfarrak",
    "guideId": 35196,
    "guideName": "Zul'Farrak Dungeon Strategy Guide - WoW: Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/zulfarrak-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 2936,
        "name": "The Spider God"
      },
      {
        "id": 2933,
        "name": "Venom Bottles"
      },
      {
        "id": 96775,
        "name": "Zum'rah's Head"
      },
      {
        "id": 2991,
        "name": "Nekrum's Medallion"
      },
      {
        "id": 2988,
        "name": "Witherbark Cages"
      },
      {
        "id": 2768,
        "name": "Divino-matic Rod"
      },
      {
        "id": 2865,
        "name": "Scarab Shells"
      },
      {
        "id": 3042,
        "name": "Troll Temper"
      },
      {
        "id": 2846,
        "name": "Tiara of the Deep"
      },
      {
        "id": 2770,
        "name": "Gahz'rilla"
      },
      {
        "id": 3527,
        "name": "The Prophecy of Mosh'aru"
      },
      {
        "id": 3520,
        "name": "Screecher Spirits"
      },
      {
        "id": 2864,
        "name": "Tran'rek"
      }
    ]
  },
  {
    "dungeonId": "maraudon",
    "guideId": 35197,
    "guideName": "Maraudon Dungeon Strategy Guide - WoW: Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/maraudon-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 96776,
        "name": "An'she's Radiance"
      },
      {
        "id": 7068,
        "name": "Shadowshard Fragments"
      },
      {
        "id": 7029,
        "name": "Vyletongue Corruption"
      },
      {
        "id": 7064,
        "name": "Corruption of Earth and Seed"
      },
      {
        "id": 7070,
        "name": "Shadowshard Fragments"
      },
      {
        "id": 7041,
        "name": "Vyletongue Corruption"
      },
      {
        "id": 7065,
        "name": "Corruption of Earth and Seed"
      },
      {
        "id": 93404,
        "name": "Rot and Regret"
      },
      {
        "id": 92914,
        "name": "Strange Pylons"
      },
      {
        "id": 7028,
        "name": "Twisted Evils"
      },
      {
        "id": 7067,
        "name": "The Pariah's Instructions"
      },
      {
        "id": 7044,
        "name": "Legends of Maraudon"
      },
      {
        "id": 7046,
        "name": "The Scepter of Celebras"
      },
      {
        "id": 7066,
        "name": "Seed of Life"
      }
    ]
  },
  {
    "dungeonId": "alcaz-prison",
    "guideId": 35355,
    "guideName": "Alcaz Prison Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/alcaz-prison-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 96772,
        "name": "The Dragon's Journal"
      },
      {
        "id": 96381,
        "name": "A Bit of Wet Work"
      },
      {
        "id": 95263,
        "name": "Somber News"
      },
      {
        "id": 95194,
        "name": "Our Man in Theramore"
      },
      {
        "id": 95262,
        "name": "The Secret Prison"
      },
      {
        "id": 95309,
        "name": "No Orc Left Behind"
      },
      {
        "id": 95454,
        "name": "The Honor of the Kor'kron"
      },
      {
        "id": 95283,
        "name": "The Missing Kor'kron"
      },
      {
        "id": 96332,
        "name": "A Little Payback"
      },
      {
        "id": 96334,
        "name": "Blood Red Bandanas"
      },
      {
        "id": 96335,
        "name": "The Man in the Iron Chains"
      },
      {
        "id": 92422,
        "name": "The Wrath of Rath'mael"
      },
      {
        "id": 92401,
        "name": "A Frightened Request"
      },
      {
        "id": 95264,
        "name": "Shaw Needs To Know"
      },
      {
        "id": 95483,
        "name": "Thrall Needs to Know"
      }
    ]
  },
  {
    "dungeonId": "sunken-temple",
    "guideId": 35200,
    "guideName": "The Temple of Atal'Hakkar Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/the-temple-of-atalhakkar-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 1445,
        "name": "The Temple of Atal'Hakkar"
      },
      {
        "id": 1424,
        "name": "Pool of Tears"
      },
      {
        "id": 4146,
        "name": "Zapper Fuel"
      },
      {
        "id": 4145,
        "name": "Larion and Muigin"
      },
      {
        "id": 4143,
        "name": "Haze of Evil"
      },
      {
        "id": 4141,
        "name": "Muigin and Larion"
      },
      {
        "id": 1475,
        "name": "Into The Temple of Atal'Hakkar"
      },
      {
        "id": 1448,
        "name": "In Search of The Temple"
      },
      {
        "id": 1446,
        "name": "Jammal'an the Prophet"
      },
      {
        "id": 3373,
        "name": "The Essence of Eranikus"
      },
      {
        "id": 3446,
        "name": "Into the Depths"
      },
      {
        "id": 3380,
        "name": "The Sunken Temple"
      },
      {
        "id": 3445,
        "name": "The Sunken Temple"
      },
      {
        "id": 3447,
        "name": "Secret of the Circle"
      },
      {
        "id": 3528,
        "name": "The God Hakkar"
      },
      {
        "id": 3520,
        "name": "Screecher Spirits"
      },
      {
        "id": 3444,
        "name": "The Stone Circle"
      },
      {
        "id": 3527,
        "name": "The Prophecy of Mosh'aru"
      },
      {
        "id": 4787,
        "name": "The Ancient Egg"
      },
      {
        "id": 2994,
        "name": "Saving Sharpbeak"
      },
      {
        "id": 7850,
        "name": "Dark Vessels"
      },
      {
        "id": 7849,
        "name": "Separation Anxiety"
      },
      {
        "id": 7861,
        "name": "WANTED: Vile Priestess Hexx and Her Minions"
      },
      {
        "id": 7862,
        "name": "Job Opening: Guard Captain of Revantusk Village"
      },
      {
        "id": 7845,
        "name": "Kidnapped Elder Torntusk!"
      },
      {
        "id": 1449,
        "name": "To The Hinterlands"
      },
      {
        "id": 1450,
        "name": "Gryphon Master Talonaxe"
      },
      {
        "id": 1451,
        "name": "Rhapsody Shindigger"
      },
      {
        "id": 1452,
        "name": "Rhapsody's Kalimdor Kocktail"
      },
      {
        "id": 1469,
        "name": "Rhapsody's Tale"
      },
      {
        "id": 4142,
        "name": "A Visit to Gregan"
      },
      {
        "id": 1429,
        "name": "The Atal'ai Exile"
      },
      {
        "id": 1444,
        "name": "Return to Fel'Zerul"
      },
      {
        "id": 4147,
        "name": "Marvon's Workshop"
      }
    ]
  },
  {
    "dungeonId": "blackrock-depths",
    "guideId": 35206,
    "guideName": "Blackrock Depths Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/blackrock-depths-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 4136,
        "name": "Ribbly Screwspigot"
      },
      {
        "id": 4324,
        "name": "Yuka Screwspigot"
      },
      {
        "id": 4123,
        "name": "The Heart of the Mountain"
      },
      {
        "id": 7848,
        "name": "Attunement to the Core"
      },
      {
        "id": 3802,
        "name": "Dark Iron Legacy"
      },
      {
        "id": 3801,
        "name": "Dark Iron Legacy"
      },
      {
        "id": 4201,
        "name": "The Love Potion"
      },
      {
        "id": 4024,
        "name": "A Taste of Flame"
      },
      {
        "id": 3441,
        "name": "Divine Retribution"
      },
      {
        "id": 4262,
        "name": "Overmaster Pyron"
      },
      {
        "id": 4263,
        "name": "Incendius!"
      },
      {
        "id": 4286,
        "name": "The Good Stuff"
      },
      {
        "id": 4126,
        "name": "Hurley Blackbreath"
      },
      {
        "id": 4341,
        "name": "Kharan Mighthammer"
      },
      {
        "id": 3702,
        "name": "The Smoldering Ruins of Thaurissan"
      },
      {
        "id": 4362,
        "name": "The Fate of the Kingdom"
      },
      {
        "id": 4241,
        "name": "Marshal Windsor"
      },
      {
        "id": 4182,
        "name": "Dragonkin Menace"
      },
      {
        "id": 4322,
        "name": "Jail Break!"
      },
      {
        "id": 4282,
        "name": "A Shred of Hope"
      },
      {
        "id": 4081,
        "name": "KILL ON SIGHT: Dark Iron Dwarves"
      },
      {
        "id": 4134,
        "name": "Lost Thunderbrew Recipe"
      },
      {
        "id": 4133,
        "name": "Vivian Lagrave"
      },
      {
        "id": 4082,
        "name": "KILL ON SIGHT: High Ranking Dark Iron Officials"
      },
      {
        "id": 4063,
        "name": "The Rise of the Machines"
      },
      {
        "id": 4061,
        "name": "The Rise of the Machines"
      },
      {
        "id": 3906,
        "name": "Disharmony of Flame"
      },
      {
        "id": 3907,
        "name": "Disharmony of Fire"
      },
      {
        "id": 3981,
        "name": "Commander Gor'shak"
      },
      {
        "id": 7201,
        "name": "The Last Element"
      },
      {
        "id": 4132,
        "name": "Operation: Death to Angerforge"
      },
      {
        "id": 4122,
        "name": "Grark Lorkrub"
      },
      {
        "id": 4003,
        "name": "The Royal Rescue"
      },
      {
        "id": 3442,
        "name": "The Flawless Flame"
      },
      {
        "id": 3443,
        "name": "Forging the Shaft"
      },
      {
        "id": 3452,
        "name": "The Flame's Casing"
      },
      {
        "id": 3453,
        "name": "The Torch of Retribution"
      },
      {
        "id": 3454,
        "name": "The Torch of Retribution"
      },
      {
        "id": 3462,
        "name": "Squire Maltrake"
      },
      {
        "id": 3463,
        "name": "Set Them Ablaze!"
      },
      {
        "id": 3481,
        "name": "Trinkets..."
      },
      {
        "id": 4023,
        "name": "A Taste of Flame"
      },
      {
        "id": 3701,
        "name": "The Smoldering Ruins of Thaurissan"
      },
      {
        "id": 4342,
        "name": "Kharan's Tale"
      },
      {
        "id": 4361,
        "name": "The Bearer of Bad News"
      },
      {
        "id": 4128,
        "name": "Ragnar Thunderbrew"
      },
      {
        "id": 4363,
        "name": "The Princess's Surprise"
      },
      {
        "id": 3982,
        "name": "What Is Going On?"
      },
      {
        "id": 4001,
        "name": "What Is Going On?"
      },
      {
        "id": 4002,
        "name": "The Eastern Kingdoms"
      },
      {
        "id": 4121,
        "name": "Precarious Predicament"
      },
      {
        "id": 4062,
        "name": "The Rise of the Machines"
      },
      {
        "id": 4004,
        "name": "The Princess Saved?"
      },
      {
        "id": 9015,
        "name": "The Challenge"
      }
    ]
  },
  {
    "dungeonId": "blackmaw-hold",
    "guideId": 35373,
    "guideName": "Blackmaw Hold Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/blackmaw-hold-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 96246,
        "name": "Blackmaw Pouches"
      },
      {
        "id": 92065,
        "name": "Blackmaw Reclamation"
      },
      {
        "id": 86746,
        "name": "The Legashi Threat"
      },
      {
        "id": 92069,
        "name": "Claws That Rend, Tusks that Gore"
      },
      {
        "id": 92066,
        "name": "The Twin Bears"
      },
      {
        "id": 92070,
        "name": "A Lost Memento"
      },
      {
        "id": 97173,
        "name": "Blackmaw Magic"
      },
      {
        "id": 92344,
        "name": "Get to the Roots of It"
      },
      {
        "id": 9234,
        "name": "Icebane Gauntlets"
      },
      {
        "id": 97198,
        "name": "Blackmaw Magic"
      },
      {
        "id": 92343,
        "name": "Get to the Roots of It"
      },
      {
        "id": 92346,
        "name": "Beneath Nordrassil"
      },
      {
        "id": 92422,
        "name": "The Wrath of Rath'mael"
      },
      {
        "id": 92401,
        "name": "A Frightened Request"
      }
    ]
  },
  {
    "dungeonId": "lower-blackrock-spire",
    "guideId": 35271,
    "guideName": "Lower Blackrock Spire Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/lower-blackrock-spire-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 4724,
        "name": "The Pack Mistress"
      },
      {
        "id": 4981,
        "name": "Operative Bijou"
      },
      {
        "id": 4982,
        "name": "Bijou's Belongings"
      },
      {
        "id": 4903,
        "name": "Warlord's Command"
      },
      {
        "id": 4701,
        "name": "Put Her Down"
      },
      {
        "id": 5089,
        "name": "General Drakkisath's Command"
      },
      {
        "id": 5001,
        "name": "Bijou's Belongings"
      },
      {
        "id": 4862,
        "name": "En-Ay-Es-Tee-Why"
      },
      {
        "id": 4729,
        "name": "Kibler's Exotic Pets"
      },
      {
        "id": 4866,
        "name": "Mother's Milk"
      },
      {
        "id": 4742,
        "name": "Seal of Ascension"
      },
      {
        "id": 4867,
        "name": "Urok Doomhowl"
      },
      {
        "id": 4788,
        "name": "The Final Tablets"
      },
      {
        "id": 3520,
        "name": "Screecher Spirits"
      },
      {
        "id": 5065,
        "name": "The Lost Tablets of Mosh'aru"
      },
      {
        "id": 3527,
        "name": "The Prophecy of Mosh'aru"
      },
      {
        "id": 4787,
        "name": "The Ancient Egg"
      },
      {
        "id": 3528,
        "name": "The God Hakkar"
      },
      {
        "id": 5081,
        "name": "Maxwell's Mission"
      },
      {
        "id": 5002,
        "name": "Message to Maxwell"
      },
      {
        "id": 4983,
        "name": "Bijou's Reconnaissance Report"
      },
      {
        "id": 4941,
        "name": "Eitrigg's Wisdom"
      },
      {
        "id": 4974,
        "name": "For The Horde!"
      },
      {
        "id": 4743,
        "name": "Seal of Ascension"
      }
    ]
  },
  {
    "dungeonId": "upper-blackrock-spire",
    "guideId": 35281,
    "guideName": "Upper Blackrock Spire Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/upper-blackrock-spire-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 4768,
        "name": "The Darkstone Tablet"
      },
      {
        "id": 4769,
        "name": "Vivian Lagrave and the Darkstone Tablet"
      },
      {
        "id": 4974,
        "name": "For The Horde!"
      },
      {
        "id": 4903,
        "name": "Warlord's Command"
      },
      {
        "id": 6602,
        "name": "Blood of the Black Dragon Champion"
      },
      {
        "id": 4764,
        "name": "Doomrigger's Clasp"
      },
      {
        "id": 4766,
        "name": "Mayara Brightwing"
      },
      {
        "id": 5102,
        "name": "General Drakkisath's Demise"
      },
      {
        "id": 5089,
        "name": "General Drakkisath's Command"
      },
      {
        "id": 6502,
        "name": "Drakefire Amulet"
      },
      {
        "id": 4182,
        "name": "Dragonkin Menace"
      },
      {
        "id": 7761,
        "name": "Blackhand's Command"
      },
      {
        "id": 5160,
        "name": "The Matron Protectorate"
      },
      {
        "id": 5047,
        "name": "Pip Quickwit, At Your Service!"
      },
      {
        "id": 4735,
        "name": "Egg Collection"
      },
      {
        "id": 4734,
        "name": "Egg Freezing"
      },
      {
        "id": 4726,
        "name": "Broodling Essence"
      },
      {
        "id": 6821,
        "name": "Eye of the Emberseer"
      },
      {
        "id": 6805,
        "name": "Stormers and Rumblers"
      },
      {
        "id": 6804,
        "name": "Poisoned Water"
      },
      {
        "id": 5127,
        "name": "The Demon Forge"
      },
      {
        "id": 5126,
        "name": "Lorax's Tale"
      },
      {
        "id": 5161,
        "name": "Wrath of the Blue Flight"
      },
      {
        "id": 5162,
        "name": "Wrath of the Blue Flight"
      },
      {
        "id": 5164,
        "name": "Catalogue of the Wayward"
      },
      {
        "id": 5166,
        "name": "Breastplate of the Chromatic Flight"
      },
      {
        "id": 5167,
        "name": "Legplates of the Chromatic Defier"
      },
      {
        "id": 4765,
        "name": "Delivery to Ridgewell"
      },
      {
        "id": 4133,
        "name": "Vivian Lagrave"
      },
      {
        "id": 4941,
        "name": "Eitrigg's Wisdom"
      },
      {
        "id": 8995,
        "name": "Mea Culpa, Lord Valthalak"
      }
    ]
  },
  {
    "dungeonId": "scholomance",
    "guideId": 35270,
    "guideName": "Scholomance Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/scholomance-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 5533,
        "name": "Scholomance"
      },
      {
        "id": 838,
        "name": "Scholomance"
      },
      {
        "id": 5537,
        "name": "Skeletal Fragments"
      },
      {
        "id": 964,
        "name": "Skeletal Fragments"
      },
      {
        "id": 5538,
        "name": "Mold Rhymes With..."
      },
      {
        "id": 5514,
        "name": "Mold Rhymes With..."
      },
      {
        "id": 5801,
        "name": "Fire Plume Forged"
      },
      {
        "id": 5802,
        "name": "Fire Plume Forged"
      },
      {
        "id": 5803,
        "name": "Araj's Scarab"
      },
      {
        "id": 5804,
        "name": "Araj's Scarab"
      },
      {
        "id": 5066,
        "name": "A Call to Arms: The Plaguelands!"
      },
      {
        "id": 5092,
        "name": "Clear the Way"
      },
      {
        "id": 5097,
        "name": "All Along the Watchtowers"
      },
      {
        "id": 5505,
        "name": "The Key to Scholomance"
      },
      {
        "id": 5093,
        "name": "A Call to Arms: The Plaguelands!"
      },
      {
        "id": 5096,
        "name": "Scarlet Diversions"
      },
      {
        "id": 5098,
        "name": "All Along the Watchtowers"
      },
      {
        "id": 5511,
        "name": "The Key to Scholomance"
      },
      {
        "id": 5341,
        "name": "Barov Family Fortune"
      },
      {
        "id": 7668,
        "name": "The Darkreaver Menace"
      },
      {
        "id": 7667,
        "name": "Material Assistance"
      },
      {
        "id": 5343,
        "name": "Barov Family Fortune"
      },
      {
        "id": 5529,
        "name": "Plagued Hatchlings"
      },
      {
        "id": 5582,
        "name": "Healthy Dragon Scale"
      },
      {
        "id": 5382,
        "name": "Doctor Theolen Krastinov, the Butcher"
      },
      {
        "id": 5515,
        "name": "Krastinov's Bag of Horrors"
      },
      {
        "id": 5384,
        "name": "Kirtonos the Herald"
      },
      {
        "id": 4771,
        "name": "Dawn's Gambit"
      },
      {
        "id": 4726,
        "name": "Broodling Essence"
      },
      {
        "id": 5466,
        "name": "The Lich, Ras Frostwhisper"
      },
      {
        "id": 8258,
        "name": "The Darkreaver Menace"
      }
    ]
  },
  {
    "dungeonId": "stratholme-live",
    "guideId": 35323,
    "guideName": "Stratholme Live Side Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/stratholme-live-side-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 5214,
        "name": "The Great Ezra Grimm"
      },
      {
        "id": 5251,
        "name": "The Archivist"
      },
      {
        "id": 5282,
        "name": "The Restless Souls"
      },
      {
        "id": 5122,
        "name": "The Medallion of Faith"
      },
      {
        "id": 5281,
        "name": "The Restless Souls"
      },
      {
        "id": 5262,
        "name": "The Truth Comes Crashing Down"
      },
      {
        "id": 5848,
        "name": "Of Love and Family"
      },
      {
        "id": 5543,
        "name": "Blood Tinged Skies"
      },
      {
        "id": 5544,
        "name": "Carrion Grubbage"
      },
      {
        "id": 5542,
        "name": "Demon Dogs"
      },
      {
        "id": 5263,
        "name": "Above and Beyond"
      },
      {
        "id": 5742,
        "name": "Redemption"
      },
      {
        "id": 5781,
        "name": "Of Forgotten Memories"
      },
      {
        "id": 5845,
        "name": "Of Lost Honor"
      },
      {
        "id": 5846,
        "name": "Of Love and Family"
      },
      {
        "id": 5125,
        "name": "Aurius' Reckoning"
      }
    ]
  },
  {
    "dungeonId": "stratholme-undead",
    "guideId": 35324,
    "guideName": "Stratholme Undead Side Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/stratholme-undead-side-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 6163,
        "name": "Ramstein"
      },
      {
        "id": 6133,
        "name": "The Ranger Lord's Behest"
      },
      {
        "id": 6022,
        "name": "To Kill With Purpose"
      },
      {
        "id": 5243,
        "name": "Houses of the Holy"
      },
      {
        "id": 5212,
        "name": "The Flesh Does Not Lie"
      },
      {
        "id": 5213,
        "name": "The Active Agent"
      },
      {
        "id": 5125,
        "name": "Aurius' Reckoning"
      },
      {
        "id": 5122,
        "name": "The Medallion of Faith"
      },
      {
        "id": 5263,
        "name": "Above and Beyond"
      },
      {
        "id": 5251,
        "name": "The Archivist"
      },
      {
        "id": 5463,
        "name": "Menethil's Gift"
      },
      {
        "id": 5382,
        "name": "Doctor Theolen Krastinov, the Butcher"
      },
      {
        "id": 8945,
        "name": "Dead Man's Plea"
      },
      {
        "id": 8923,
        "name": "A Supernatural Device"
      },
      {
        "id": 8922,
        "name": "A Supernatural Device"
      },
      {
        "id": 5262,
        "name": "The Truth Comes Crashing Down"
      },
      {
        "id": 6135,
        "name": "Duskwing, Oh How I Hate Thee..."
      },
      {
        "id": 5466,
        "name": "The Lich, Ras Frostwhisper"
      },
      {
        "id": 5515,
        "name": "Krastinov's Bag of Horrors"
      },
      {
        "id": 5384,
        "name": "Kirtonos the Herald"
      },
      {
        "id": 5461,
        "name": "The Human, Ras Frostwhisper"
      },
      {
        "id": 5462,
        "name": "The Dying, Ras Frostwhisper"
      },
      {
        "id": 5464,
        "name": "Menethil's Gift"
      }
    ]
  },
  {
    "dungeonId": "dire-maul-east",
    "guideId": 35224,
    "guideName": "Dire Maul Warpwood Quarter Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Foreve",
    "guideUrl": "https://www.wowhead.com/forever/guide/dire-maul-warpwood-quarter-east-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 7489,
        "name": "Lethtendris's Web"
      },
      {
        "id": 7488,
        "name": "Lethtendris's Web"
      },
      {
        "id": 7441,
        "name": "Pusillin and the Elder Azj'Tordin"
      },
      {
        "id": 5526,
        "name": "Shards of the Felvine"
      },
      {
        "id": 5527,
        "name": "A Reliquary of Purity"
      },
      {
        "id": 7463,
        "name": "Arcane Refreshment"
      }
    ]
  },
  {
    "dungeonId": "dire-maul-west",
    "guideId": 35227,
    "guideName": "Dire Maul Capital Gardens Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/dire-maul-capital-gardens-west-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 7461,
        "name": "The Madness Within"
      },
      {
        "id": 7507,
        "name": "Nostro's Compendium"
      },
      {
        "id": 7462,
        "name": "The Treasure of the Shen'dralar"
      },
      {
        "id": 7631,
        "name": "Dreadsteed of Xoroth"
      }
    ]
  },
  {
    "dungeonId": "dire-maul-north",
    "guideId": 35230,
    "guideName": "Dire Maul Gordoks Commons Dungeon Overview Guide: Quests, Location, Strategy & Rewards - WoW Forever",
    "guideUrl": "https://www.wowhead.com/forever/guide/dire-maul-gordoks-commons-north-dungeon-overview-location-rewards",
    "quests": [
      {
        "id": 7481,
        "name": "Elven Legends"
      },
      {
        "id": 7485,
        "name": "Libram of Protection"
      },
      {
        "id": 7483,
        "name": "Libram of Rapidity"
      },
      {
        "id": 7484,
        "name": "Libram of Focus"
      },
      {
        "id": 7482,
        "name": "Elven Legends"
      },
      {
        "id": 5525,
        "name": "Free Knot!"
      },
      {
        "id": 5518,
        "name": "The Gordok Ogre Suit"
      },
      {
        "id": 5528,
        "name": "The Gordok Taste Test"
      },
      {
        "id": 7703,
        "name": "Unfinished Gordok Business"
      },
      {
        "id": 7461,
        "name": "The Madness Within"
      },
      {
        "id": 7429,
        "name": "Free Knot!"
      },
      {
        "id": 7506,
        "name": "The Emerald Dream..."
      },
      {
        "id": 7503,
        "name": "The Greatest Race of Hunters"
      },
      {
        "id": 7500,
        "name": "The Arcanist's Cookbook"
      },
      {
        "id": 7501,
        "name": "The Light and How To Swing It"
      },
      {
        "id": 7504,
        "name": "Holy Bologna: What the Light Won't Tell You"
      },
      {
        "id": 7498,
        "name": "Garona: A Study on Stealth and Treachery"
      },
      {
        "id": 7505,
        "name": "Frost Shock and You"
      },
      {
        "id": 7502,
        "name": "Harnessing Shadows"
      },
      {
        "id": 7499,
        "name": "Codex of Defense"
      },
      {
        "id": 1193,
        "name": "A Broken Trap"
      }
    ]
  }
];

export const dungeonQuestCatalog = rawDungeonQuestCatalog.map(dungeon => ({
  ...dungeon,
  quests: dungeon.quests.filter(quest => !allianceOnlyQuestIds.has(quest.id))
}));

export const dungeonQuestById = new Map(dungeonQuestCatalog.map(entry => [entry.dungeonId, entry]));
export const questGuideUrl = "https://www.wowhead.com/forever/guide/dungeons/every-dungeon-quest-location";
