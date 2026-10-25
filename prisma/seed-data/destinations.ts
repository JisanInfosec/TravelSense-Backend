/**
 * Demonstration destinations for TravelSense.
 *
 * IMPORTANT — content status:
 * - Every destination is seeded with `isVerified: false`. Names, regions and descriptions are
 *   general public knowledge, but opening hours, fees, coordinates (approximate) and nearby
 *   facility details MUST be checked by the project owner before the site is used publicly.
 * - Phone numbers are only included where they are nationally known (999). Facility phone
 *   numbers are intentionally left empty rather than guessed.
 * - "Official website" links point to the managing government authority where the site has no
 *   page of its own, and say so via `websiteLabel`. No Facebook/YouTube accounts are invented.
 * - Photos come from Wikimedia Commons and carry their author/licence credit (see images.json).
 */
import type { Category, FacilityType } from '../../src/generated/prisma/enums.js';

export interface SeedDestination {
  slug: string;
  name: string;
  category: Category;
  district: string;
  division: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  shortDescription: string;
  description: string;
  openingHours?: string;
  entryFee?: string;
  bestTimeToVisit?: string;
  isFeatured?: boolean;
  isHiddenGem?: boolean;
  safety: { tips: string[]; warnings: string[] };
  facilities: { type: FacilityType; name: string; address?: string }[];
  links?: { website?: string; websiteLabel?: string };
}

const DOA = { website: 'https://archaeology.gov.bd/', websiteLabel: 'Department of Archaeology (managing authority)' };
const FOREST = { website: 'https://bforest.gov.bd/', websiteLabel: 'Bangladesh Forest Department (managing authority)' };
const MUSEUM = { website: 'https://bangladeshmuseum.gov.bd/', websiteLabel: 'Bangladesh National Museum' };

const beachSafety = {
  tips: [
    'Swim only in areas watched by lifeguards and follow the flag signals on the beach.',
    'Check tide times before walking far along the shoreline.',
    'Carry drinking water and use sun protection during the middle of the day.',
  ],
  warnings: [
    'Strong currents and sudden drop-offs can make swimming dangerous, especially during monsoon.',
    'Stay out of the water when cyclone or storm warning signals are raised.',
  ],
};

const hillSafety = {
  tips: [
    'Travel with a registered local guide where one is required, and carry your national ID or passport.',
    'Start trips early so that you are back before dark; mountain roads are narrow and winding.',
    'Carry water, basic first aid and a power bank — mobile coverage can be limited.',
  ],
  warnings: [
    'Hill tracts areas may have travel permissions or restrictions that change. Check current rules with local authorities before travelling.',
    'Trails become slippery and landslides can occur during heavy rain.',
  ],
};

const forestSafety = {
  tips: [
    'Stay on marked trails and keep noise low to avoid disturbing wildlife.',
    'Wear long sleeves and use insect repellent.',
    'Do not leave plastic or food waste behind.',
  ],
  warnings: ['Do not feed or approach wild animals.', 'Avoid walking alone in dense forest areas.'],
};

const heritageSafety = {
  tips: [
    'Keep valuables secure in crowded areas.',
    'Respect signage — climbing on protected structures is not allowed.',
    'Carry water; there can be little shade in open courtyards.',
  ],
  warnings: ['Ticket counters may close before the site itself. Arrive with enough time to visit.'],
};

export const destinations: SeedDestination[] = [
  {
    slug: 'coxs-bazar-sea-beach',
    name: "Cox's Bazar Sea Beach",
    category: 'BEACH',
    district: "Cox's Bazar",
    division: 'Chattogram',
    address: "Kolatoli / Laboni Point, Cox's Bazar",
    latitude: 21.4143,
    longitude: 91.9832,
    shortDescription: 'One of the longest natural sandy sea beaches in the world, stretching along the Bay of Bengal.',
    description:
      "Cox's Bazar is Bangladesh's best-known seaside destination. Its long, gently sloping sandy beach runs south along the Bay of Bengal towards Teknaf, with popular access points at Laboni, Sugandha and Kolatoli. Visitors come for sunsets, beach walks and seafood, and use the town as a base for trips to Himchari, Inani and the Marine Drive coastal road.",
    openingHours: 'Public beach, accessible at all hours',
    entryFee: 'No entry fee for the public beach',
    bestTimeToVisit: 'November to March (dry, pleasant weather)',
    isFeatured: true,
    safety: beachSafety,
    facilities: [
      { type: 'HOSPITAL', name: "Cox's Bazar District Sadar Hospital", address: "Cox's Bazar town" },
      { type: 'POLICE_STATION', name: "Cox's Bazar Sadar Model Police Station", address: "Cox's Bazar town" },
    ],
  },
  {
    slug: 'saint-martins-island',
    name: "Saint Martin's Island",
    category: 'BEACH',
    district: "Cox's Bazar",
    division: 'Chattogram',
    address: "Teknaf Upazila, Cox's Bazar",
    latitude: 20.6131,
    longitude: 92.3267,
    shortDescription: "Bangladesh's only coral island, known for clear water, coconut groves and quiet beaches.",
    description:
      "Saint Martin's Island lies in the north-eastern Bay of Bengal, south of the Teknaf peninsula. It is the only coral-bearing island in the country and an ecologically sensitive area. Visitors walk around the island, watch the sunset and visit the nearby Chhera Dwip at low tide. Because of conservation concerns, tourist access is regulated by the government.",
    openingHours: 'Access depends on seasonal government regulations and ship schedules',
    entryFee: 'Information not available',
    bestTimeToVisit: 'November to February (when tourist access is permitted)',
    isFeatured: true,
    safety: {
      tips: [
        'Check the current government rules on tourist access, permitted months and visitor limits before planning your trip.',
        'Do not collect or step on coral, shells or marine life.',
        ...beachSafety.tips.slice(1),
      ],
      warnings: [
        'Sea crossings are cancelled during rough weather — keep a buffer day in your plans.',
        ...beachSafety.warnings,
      ],
    },
    facilities: [{ type: 'POLICE_STATION', name: 'Teknaf Model Police Station', address: "Teknaf, Cox's Bazar" }],
  },
  {
    slug: 'kuakata-sea-beach',
    name: 'Kuakata Sea Beach',
    category: 'BEACH',
    district: 'Patuakhali',
    division: 'Barishal',
    address: 'Kalapara Upazila, Patuakhali',
    latitude: 21.8167,
    longitude: 90.1206,
    shortDescription: 'A wide beach where visitors can watch both sunrise and sunset over the Bay of Bengal.',
    description:
      'Kuakata, sometimes called "Sagar Kanya" (daughter of the sea), is a long beach on the southern coast of Patuakhali. It is one of the few places in the country where both sunrise and sunset can be seen over the sea. Nearby attractions include the Buddhist temple at Misripara, fishing villages and mangrove patches along the coast.',
    openingHours: 'Public beach, accessible at all hours',
    entryFee: 'No entry fee for the public beach',
    bestTimeToVisit: 'October to March',
    isHiddenGem: true,
    safety: beachSafety,
    facilities: [
      { type: 'HOSPITAL', name: 'Kalapara Upazila Health Complex', address: 'Kalapara, Patuakhali' },
      { type: 'POLICE_STATION', name: 'Mohipur Police Station', address: 'Mohipur, Kalapara, Patuakhali' },
    ],
  },
  {
    slug: 'sajek-valley',
    name: 'Sajek Valley',
    category: 'HILL',
    district: 'Rangamati',
    division: 'Chattogram',
    address: 'Baghaichhari Upazila, Rangamati',
    latitude: 23.382,
    longitude: 92.2938,
    shortDescription: 'A hilltop village famous for sweeping views of rolling hills and morning clouds.',
    description:
      'Sajek Valley sits high on a ridge in the Chittagong Hill Tracts, close to the border with Mizoram. It is known for its views over layers of green hills and for clouds that drift through the valley in the early morning, especially after rain. Ruilui and Konglak are the main settlements, with Konglak Hill offering a short climb to a wide viewpoint.',
    openingHours: 'Village area; road access usually in daylight hours with security escort',
    entryFee: 'Information not available',
    bestTimeToVisit: 'September to November for clouds and greenery; December to February for clear views',
    isFeatured: true,
    safety: hillSafety,
    facilities: [
      { type: 'HOSPITAL', name: 'Baghaichhari Upazila Health Complex', address: 'Baghaichhari, Rangamati' },
      { type: 'POLICE_STATION', name: 'Baghaichhari Police Station', address: 'Baghaichhari, Rangamati' },
    ],
  },
  {
    slug: 'nilgiri-bandarban',
    name: 'Nilgiri',
    category: 'HILL',
    district: 'Bandarban',
    division: 'Chattogram',
    address: 'Bandarban–Thanchi Road, Bandarban',
    latitude: 21.9095,
    longitude: 92.3368,
    shortDescription: 'A hilltop viewpoint on the Thanchi road with wide views over the Bandarban hills.',
    description:
      'Nilgiri is a popular hilltop viewpoint on the road from Bandarban town towards Thanchi. On clear days it gives a wide view over the surrounding hills, and in the monsoon months clouds often pass below the viewpoint. It is commonly combined with visits to Chimbuk and Shoilo Propat waterfall.',
    openingHours: 'Information not available',
    entryFee: 'Information not available',
    bestTimeToVisit: 'October to February',
    safety: hillSafety,
    facilities: [
      { type: 'HOSPITAL', name: 'Bandarban Sadar Hospital', address: 'Bandarban town' },
    ],
  },
  {
    slug: 'nafakhum-waterfall',
    name: 'Nafakhum Waterfall',
    category: 'WATERFALL',
    district: 'Bandarban',
    division: 'Chattogram',
    address: 'Remakri, Thanchi Upazila, Bandarban',
    latitude: 21.7203,
    longitude: 92.5337,
    shortDescription: 'A wide, powerful waterfall on the Sangu river reached by boat and a jungle trek.',
    description:
      'Nafakhum is one of the largest waterfalls in Bangladesh by volume, where the Remakri stream drops over a broad rock ledge. Reaching it usually involves travelling from Thanchi by boat on the Sangu river to Remakri and then trekking along the stream. It is a demanding trip that rewards visitors with remote scenery and indigenous villages.',
    openingHours: 'Information not available',
    entryFee: 'Information not available',
    bestTimeToVisit: 'Late monsoon to early winter (September to November) when water flow is strong but trails are passable',
    isHiddenGem: true,
    safety: {
      tips: hillSafety.tips,
      warnings: [
        'Do not swim near the base of the waterfall; currents and hidden rocks are dangerous.',
        'River levels can rise quickly after rain. Follow your guide and boatman’s advice.',
        ...hillSafety.warnings,
      ],
    },
    facilities: [{ type: 'POLICE_STATION', name: 'Thanchi Police Station', address: 'Thanchi, Bandarban' }],
  },
  {
    slug: 'madhabkunda-waterfall',
    name: 'Madhabkunda Waterfall',
    category: 'WATERFALL',
    district: 'Moulvibazar',
    division: 'Sylhet',
    address: 'Barlekha Upazila, Moulvibazar',
    latitude: 24.6385,
    longitude: 92.2246,
    shortDescription: 'A well-known waterfall surrounded by tea gardens and hills in Moulvibazar.',
    description:
      'Madhabkunda is one of the most visited waterfalls in Bangladesh. Water falls from a hill into a pool below, surrounded by forest and tea gardens. There is an eco-park around the waterfall with walking paths, and Khasia villages and the smaller Porikunda waterfall nearby.',
    openingHours: 'Information not available',
    entryFee: 'Ticketed eco-park; current fee not available',
    bestTimeToVisit: 'June to October for the strongest flow',
    safety: {
      tips: forestSafety.tips,
      warnings: ['Rocks around the pool are slippery. Do not climb the falls.', ...forestSafety.warnings],
    },
    facilities: [
      { type: 'HOSPITAL', name: 'Barlekha Upazila Health Complex', address: 'Barlekha, Moulvibazar' },
      { type: 'POLICE_STATION', name: 'Barlekha Police Station', address: 'Barlekha, Moulvibazar' },
    ],
  },
  {
    slug: 'sundarbans',
    name: 'Sundarbans (Karamjal)',
    category: 'FOREST',
    district: 'Bagerhat',
    division: 'Khulna',
    address: 'Karamjal Eco-Tourism Centre, near Mongla, Bagerhat',
    latitude: 22.428,
    longitude: 89.594,
    shortDescription: "The world's largest mangrove forest and home of the Bengal tiger — a UNESCO World Heritage Site.",
    description:
      'The Sundarbans is a vast mangrove forest in the delta of the Ganges, Brahmaputra and Meghna rivers, shared between Bangladesh and India. It is home to the Bengal tiger, spotted deer, crocodiles and many bird species. Karamjal near Mongla is a short-trip entry point with a raised walkway and a wildlife breeding centre; longer boat tours go deeper into the forest.',
    openingHours: 'Information not available',
    entryFee: 'Forest entry permits and fees apply; current rates not available',
    bestTimeToVisit: 'November to February',
    isFeatured: true,
    safety: {
      tips: ['Travel only with licensed tour operators and armed forest guards where required.', ...forestSafety.tips],
      warnings: [
        'Never leave the boat or walkway without your guide — tigers and crocodiles live in the forest.',
        ...forestSafety.warnings,
      ],
    },
    facilities: [],
    links: FOREST,
  },
  {
    slug: 'ratargul-swamp-forest',
    name: 'Ratargul Swamp Forest',
    category: 'FOREST',
    district: 'Sylhet',
    division: 'Sylhet',
    address: 'Gowainghat Upazila, Sylhet',
    latitude: 25.0089,
    longitude: 91.9306,
    shortDescription: 'A freshwater swamp forest explored by small boat between partly submerged trees.',
    description:
      'Ratargul is a freshwater swamp forest north of Sylhet city. During the monsoon the forest floods and visitors glide between half-submerged trees on small wooden boats. It is a protected area and one of the few freshwater swamp forests in the country.',
    openingHours: 'Information not available',
    entryFee: 'Information not available',
    bestTimeToVisit: 'July to October, when the forest is flooded',
    isHiddenGem: true,
    safety: {
      tips: ['Wear a life jacket on the boat.', ...forestSafety.tips],
      warnings: ['Snakes may be present in the trees and water. Keep hands inside the boat.', ...forestSafety.warnings],
    },
    facilities: [
      { type: 'HOSPITAL', name: 'Gowainghat Upazila Health Complex', address: 'Gowainghat, Sylhet' },
      { type: 'POLICE_STATION', name: 'Gowainghat Police Station', address: 'Gowainghat, Sylhet' },
    ],
    links: FOREST,
  },
  {
    slug: 'lawachara-national-park',
    name: 'Lawachara National Park',
    category: 'PARK',
    district: 'Moulvibazar',
    division: 'Sylhet',
    address: 'Kamalganj Upazila, near Sreemangal, Moulvibazar',
    latitude: 24.3197,
    longitude: 91.7836,
    shortDescription: 'A tropical forest reserve near Sreemangal, home to the endangered western hoolock gibbon.',
    description:
      'Lawachara National Park is a semi-evergreen forest close to Sreemangal, the tea capital of Bangladesh. Marked trails lead through tall trees where visitors may hear or see western hoolock gibbons, langurs and many birds. A railway line runs through the park, and Khasia villages lie nearby.',
    openingHours: 'Information not available',
    entryFee: 'Ticketed national park; current fee not available',
    bestTimeToVisit: 'October to March',
    isHiddenGem: true,
    safety: forestSafety,
    facilities: [{ type: 'POLICE_STATION', name: 'Sreemangal Police Station', address: 'Sreemangal, Moulvibazar' }],
    links: FOREST,
  },
  {
    slug: 'lalbagh-fort',
    name: 'Lalbagh Fort',
    category: 'HISTORICAL',
    district: 'Dhaka',
    division: 'Dhaka',
    address: 'Lalbagh, Old Dhaka',
    latitude: 23.719,
    longitude: 90.3882,
    shortDescription: 'An unfinished 17th-century Mughal fort complex in the heart of Old Dhaka.',
    description:
      "Lalbagh Fort was begun in 1678 by Prince Muhammad Azam, son of Emperor Aurangzeb, and continued by Shaista Khan, but was never completed. The complex includes the tomb of Pari Bibi, the Diwan-i-Aam audience hall with its hammam, and a three-domed mosque, set within gardens. It is one of Dhaka's most visited historic sites.",
    openingHours: 'Ticketed site with weekly closing days; confirm current hours with the Department of Archaeology',
    entryFee: 'Ticketed; current fee not available',
    bestTimeToVisit: 'November to February; mornings are less crowded',
    isFeatured: true,
    safety: heritageSafety,
    facilities: [
      { type: 'HOSPITAL', name: 'Sir Salimullah Medical College & Mitford Hospital', address: 'Mitford Road, Old Dhaka' },
      { type: 'POLICE_STATION', name: 'Lalbagh Police Station', address: 'Lalbagh, Dhaka' },
    ],
    links: DOA,
  },
  {
    slug: 'ahsan-manzil',
    name: 'Ahsan Manzil',
    category: 'MUSEUM',
    district: 'Dhaka',
    division: 'Dhaka',
    address: 'Kumartoli, on the bank of the Buriganga, Old Dhaka',
    latitude: 23.7086,
    longitude: 90.4061,
    shortDescription: 'The "Pink Palace" of the Dhaka Nawabs, now a museum on the Buriganga riverfront.',
    description:
      'Ahsan Manzil was the official residence and seat of the Nawabs of Dhaka. The pink palace, with its large dome and grand staircase facing the Buriganga river, was restored and opened as a museum. Its galleries show furniture, portraits and objects from the Nawab family and the history of Dhaka.',
    openingHours: 'Museum hours apply with a weekly closing day; confirm current hours before visiting',
    entryFee: 'Ticketed; current fee not available',
    bestTimeToVisit: 'November to February',
    safety: heritageSafety,
    facilities: [
      { type: 'HOSPITAL', name: 'Sir Salimullah Medical College & Mitford Hospital', address: 'Mitford Road, Old Dhaka' },
    ],
    links: { ...MUSEUM, websiteLabel: 'Bangladesh National Museum (managing authority)' },
  },
  {
    slug: 'somapura-mahavihara',
    name: 'Somapura Mahavihara (Paharpur)',
    category: 'HISTORICAL',
    district: 'Naogaon',
    division: 'Rajshahi',
    address: 'Paharpur, Badalgachhi Upazila, Naogaon',
    latitude: 25.0311,
    longitude: 88.9769,
    shortDescription: 'Ruins of one of the largest Buddhist monasteries south of the Himalayas — a UNESCO World Heritage Site.',
    description:
      'Somapura Mahavihara at Paharpur was a major centre of Buddhist learning from the 8th century. The vast square monastery surrounds a towering cruciform central shrine decorated with terracotta plaques. A site museum displays objects found during excavations.',
    openingHours: 'Ticketed site with weekly closing days; confirm current hours with the Department of Archaeology',
    entryFee: 'Ticketed; current fee not available',
    bestTimeToVisit: 'November to February',
    isHiddenGem: true,
    safety: heritageSafety,
    facilities: [
      { type: 'HOSPITAL', name: 'Badalgachhi Upazila Health Complex', address: 'Badalgachhi, Naogaon' },
      { type: 'POLICE_STATION', name: 'Badalgachhi Police Station', address: 'Badalgachhi, Naogaon' },
    ],
    links: DOA,
  },
  {
    slug: 'bangladesh-national-museum',
    name: 'Bangladesh National Museum',
    category: 'MUSEUM',
    district: 'Dhaka',
    division: 'Dhaka',
    address: 'Shahbagh, Dhaka',
    latitude: 23.7375,
    longitude: 90.3945,
    shortDescription: "The country's largest museum, covering art, history, natural history and the Liberation War.",
    description:
      "The Bangladesh National Museum at Shahbagh holds collections of archaeology, sculpture, coins, textiles, natural history and contemporary art, as well as galleries on the Liberation War of 1971. It is a good starting point for understanding the country's history before travelling further.",
    openingHours: 'Museum hours apply with a weekly closing day; see the official website',
    entryFee: 'Ticketed; current fee not available',
    bestTimeToVisit: 'All year (indoor)',
    safety: { tips: ['Bags may need to be left at the cloakroom.', 'Photography rules vary by gallery.'], warnings: [] },
    facilities: [
      { type: 'HOSPITAL', name: 'Dhaka Medical College Hospital', address: 'Bakshibazar, Dhaka' },
      { type: 'POLICE_STATION', name: 'Shahbagh Police Station', address: 'Shahbagh, Dhaka' },
    ],
    links: MUSEUM,
  },
  {
    slug: 'sixty-dome-mosque',
    name: 'Sixty Dome Mosque',
    category: 'RELIGIOUS_CULTURAL',
    district: 'Bagerhat',
    division: 'Khulna',
    address: 'Bagerhat Sadar, Bagerhat',
    latitude: 22.6744,
    longitude: 89.7419,
    shortDescription: 'A 15th-century mosque in the Historic Mosque City of Bagerhat — a UNESCO World Heritage Site.',
    description:
      'The Shait Gumbad (Sixty Dome) Mosque was built in the 15th century during the time of Khan Jahan Ali. Despite its name it has many more than sixty domes over a large prayer hall supported by stone pillars. It is the centrepiece of the Historic Mosque City of Bagerhat, which also includes the mausoleum of Khan Jahan Ali and several smaller mosques.',
    openingHours: 'Active mosque; visiting may be restricted during prayer times',
    entryFee: 'Ticketed for visitors; current fee not available',
    bestTimeToVisit: 'November to February',
    isFeatured: true,
    safety: {
      tips: ['Dress modestly and remove shoes before entering the prayer hall.', ...heritageSafety.tips.slice(0, 1)],
      warnings: ['Avoid visiting during Friday prayers if you are not attending.'],
    },
    facilities: [
      { type: 'HOSPITAL', name: 'Bagerhat District Hospital', address: 'Bagerhat town' },
      { type: 'POLICE_STATION', name: 'Bagerhat Model Police Station', address: 'Bagerhat town' },
    ],
    links: DOA,
  },
  {
    slug: 'kantajew-temple',
    name: 'Kantajew Temple',
    category: 'RELIGIOUS_CULTURAL',
    district: 'Dinajpur',
    division: 'Rangpur',
    address: 'Kantanagar, Kaharole Upazila, Dinajpur',
    latitude: 25.7906,
    longitude: 88.6667,
    shortDescription: 'An early 18th-century Hindu temple covered in remarkably detailed terracotta panels.',
    description:
      'Kantajew Temple at Kantanagar was completed in the early 18th century. Every surface of the three-storey temple is covered with terracotta plaques showing scenes from the Mahabharata, the Ramayana and everyday life of the time. It is one of the finest examples of terracotta architecture in Bengal.',
    openingHours: 'Active temple; information on visiting hours not available',
    entryFee: 'Information not available',
    bestTimeToVisit: 'November to February',
    isHiddenGem: true,
    safety: {
      tips: ['Dress modestly and follow temple customs.', 'Do not touch or lean on the terracotta panels.'],
      warnings: [],
    },
    facilities: [{ type: 'POLICE_STATION', name: 'Kaharole Police Station', address: 'Kaharole, Dinajpur' }],
  },
  {
    slug: 'panam-nagar',
    name: 'Panam Nagar',
    category: 'HISTORICAL',
    district: 'Narayanganj',
    division: 'Dhaka',
    address: 'Sonargaon Upazila, Narayanganj',
    latitude: 23.656,
    longitude: 90.6042,
    shortDescription: 'An abandoned street of colonial-era merchant houses in the old capital of Sonargaon.',
    description:
      "Panam Nagar is a single street lined with two- and three-storey brick houses built by wealthy Hindu merchants in the 19th and early 20th centuries. Now largely abandoned, the decaying facades with their arches and ironwork make it one of the most atmospheric heritage sites near Dhaka. It is close to the Folk Art and Crafts Museum in Sonargaon.",
    openingHours: 'Ticketed site; confirm current hours with the Department of Archaeology',
    entryFee: 'Ticketed; current fee not available',
    bestTimeToVisit: 'November to February',
    isHiddenGem: true,
    safety: {
      tips: heritageSafety.tips,
      warnings: ['Many buildings are structurally fragile. Do not enter cordoned-off houses.'],
    },
    facilities: [
      { type: 'HOSPITAL', name: 'Sonargaon Upazila Health Complex', address: 'Sonargaon, Narayanganj' },
      { type: 'POLICE_STATION', name: 'Sonargaon Police Station', address: 'Sonargaon, Narayanganj' },
    ],
    links: DOA,
  },
  {
    slug: 'ramna-park',
    name: 'Ramna Park',
    category: 'PARK',
    district: 'Dhaka',
    division: 'Dhaka',
    address: 'Ramna, Dhaka',
    latitude: 23.738,
    longitude: 90.401,
    shortDescription: "A green oasis in central Dhaka, famous for its Pohela Boishakh celebrations.",
    description:
      'Ramna Park is a large urban park in central Dhaka with a lake, walking paths and old trees. It is a favourite place for morning walks and is known nationally as the venue for Bengali New Year (Pohela Boishakh) celebrations under the Ramna Batamul.',
    openingHours: 'Information not available',
    entryFee: 'No entry fee',
    bestTimeToVisit: 'All year; mornings and evenings are most pleasant',
    safety: {
      tips: ['Keep valuables secure on festival days when the park is very crowded.'],
      warnings: ['Avoid isolated areas of the park after dark.'],
    },
    facilities: [
      { type: 'HOSPITAL', name: 'Dhaka Medical College Hospital', address: 'Bakshibazar, Dhaka' },
      { type: 'POLICE_STATION', name: 'Ramna Model Police Station', address: 'Ramna, Dhaka' },
    ],
  },
];
