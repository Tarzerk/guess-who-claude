// Character packs — each pack has exactly 24 people.
// Both offline players pick the same pack to ensure matching boards.
// Online mode also uses a single pack so only 24 images are fetched.

// Classic pack — all 28 characters; 24 are randomly selected each game
const CLASSIC_CHARACTERS = [
  "Abigail", "Alex", "Alice", "Amy", "Andy", "Ashley", "Brandon", "Brian",
  "Daniel", "David", "Emily", "Henry", "Jake", "James", "Joe", "Jon",
  "Joseph", "Joshua", "Justin", "Kyle", "Matt", "Megan", "Melissa", "Nick",
  "Peter", "Rachael", "Tyler", "William"
];

const CHARACTER_PACKS = {
  "Classic": CLASSIC_CHARACTERS,
  "Pop Stars": [
    "Taylor Swift", "Beyoncé", "Billie Eilish", "Ariana Grande",
    "Rihanna", "Drake", "Dua Lipa", "Lady Gaga",
    "Shakira", "Adele", "Miley Cyrus", "Nicki Minaj",
    "SZA", "Olivia Rodrigo", "Sabrina Carpenter", "Lana Del Rey",
    "Chappell Roan", "Charli XCX", "The Weeknd", "Harry Styles",
    "Post Malone", "Bad Bunny", "Karol G", "Bruno Mars"
  ],
  "Movie Stars": [
    "Dwayne Johnson", "Zendaya", "Ryan Reynolds", "Tom Holland",
    "Chris Hemsworth", "Leonardo DiCaprio", "Scarlett Johansson", "Robert Downey Jr.",
    "Emma Watson", "Chris Pratt", "Margot Robbie", "Pedro Pascal",
    "Tom Hanks", "Gal Gadot", "Brad Pitt", "Ryan Gosling",
    "Johnny Depp", "Chris Evans", "Tom Cruise", "Ana de Armas",
    "Jack Black", "Anya Taylor-Joy", "Florence Pugh", "Danny DeVito"
  ],
  "Icons & Athletes": [
    "Selena Gomez", "Keanu Reeves", "Morgan Freeman", "Denzel Washington",
    "Jason Momoa", "Samuel L. Jackson", "Vin Diesel", "Kevin Hart",
    "Snoop Dogg", "Adam Sandler", "Oprah Winfrey", "Reese Witherspoon",
    "Serena Williams", "LeBron James", "Lionel Messi", "Cristiano Ronaldo",
    "Stephen Curry", "Travis Kelce", "Patrick Mahomes", "Shohei Ohtani",
    "Usain Bolt", "Will Smith", "Jennifer Lawrence", "Timothée Chalamet"
  ],
  "New Wave": [
    "Ice Spice", "Jenna Ortega", "Sydney Sweeney", "Dove Cameron",
    "Tyla", "Rosalía", "Cardi B", "Megan Thee Stallion",
    "Lizzo", "Hailey Bieber", "Kylie Jenner", "Kendall Jenner",
    "Travis Scott", "Millie Bobby Brown", "Madison Beer", "21 Savage",
    "Rachel Zegler", "Camila Cabello", "Tyler, the Creator", "Lupita Nyong'o",
    "Lil Nas X", "Hailee Steinfeld", "J. Cole", "Awkwafina"
  ]
};

const PACK_NAMES = Object.keys(CHARACTER_PACKS);

// Wikipedia article titles for image lookups
const WIKI_TITLES = {
  "Taylor Swift": "Taylor_Swift", "Dwayne Johnson": "Dwayne_Johnson",
  "Zendaya": "Zendaya", "Ryan Reynolds": "Ryan_Reynolds",
  "Beyoncé": "Beyoncé", "Tom Holland": "Tom_Holland",
  "Billie Eilish": "Billie_Eilish", "Chris Hemsworth": "Chris_Hemsworth",
  "Selena Gomez": "Selena_Gomez", "Keanu Reeves": "Keanu_Reeves",
  "Ariana Grande": "Ariana_Grande", "Timothée Chalamet": "Timothée_Chalamet",
  "Jennifer Lawrence": "Jennifer_Lawrence", "Leonardo DiCaprio": "Leonardo_DiCaprio",
  "Rihanna": "Rihanna", "Will Smith": "Will_Smith",
  "Scarlett Johansson": "Scarlett_Johansson", "Robert Downey Jr.": "Robert_Downey_Jr.",
  "Emma Watson": "Emma_Watson", "Chris Pratt": "Chris_Pratt",
  "Kylie Jenner": "Kylie_Jenner", "Drake": "Drake_(musician)",
  "Margot Robbie": "Margot_Robbie", "Pedro Pascal": "Pedro_Pascal",
  "Bad Bunny": "Bad_Bunny", "Harry Styles": "Harry_Styles",
  "Dua Lipa": "Dua_Lipa", "Morgan Freeman": "Morgan_Freeman",
  "Cardi B": "Cardi_B", "Tom Hanks": "Tom_Hanks",
  "Gal Gadot": "Gal_Gadot", "Post Malone": "Post_Malone",
  "Lady Gaga": "Lady_Gaga", "Brad Pitt": "Brad_Pitt",
  "Shakira": "Shakira_(singer)", "Denzel Washington": "Denzel_Washington",
  "Adele": "Adele_(singer)", "Jason Momoa": "Jason_Momoa",
  "Miley Cyrus": "Miley_Cyrus", "Samuel L. Jackson": "Samuel_L._Jackson",
  "Nicki Minaj": "Nicki_Minaj", "Ryan Gosling": "Ryan_Gosling",
  "SZA": "SZA_(singer)", "Johnny Depp": "Johnny_Depp",
  "Olivia Rodrigo": "Olivia_Rodrigo", "Chris Evans": "Chris_Evans_(actor)",
  "Megan Thee Stallion": "Megan_Thee_Stallion", "Vin Diesel": "Vin_Diesel",
  "Lizzo": "Lizzo_(singer)", "Tom Cruise": "Tom_Cruise",
  "Hailey Bieber": "Hailey_Bieber", "Jeff Bezos": "Jeff_Bezos",
  "Kendall Jenner": "Kendall_Jenner", "Elon Musk": "Elon_Musk",
  "Ice Spice": "Ice_Spice", "Mark Zuckerberg": "Mark_Zuckerberg",
  "Sabrina Carpenter": "Sabrina_Carpenter", "LeBron James": "LeBron_James",
  "Karol G": "Karol_G", "Lionel Messi": "Lionel_Messi",
  "Lana Del Rey": "Lana_Del_Rey", "Cristiano Ronaldo": "Cristiano_Ronaldo",
  "Dove Cameron": "Dove_Cameron", "Serena Williams": "Serena_Williams",
  "Chappell Roan": "Chappell_Roan", "Stephen Curry": "Stephen_Curry",
  "Sydney Sweeney": "Sydney_Sweeney", "Travis Kelce": "Travis_Kelce",
  "Rosalía": "Rosalía_(singer)", "Patrick Mahomes": "Patrick_Mahomes",
  "Florence Pugh": "Florence_Pugh", "Shohei Ohtani": "Shohei_Ohtani",
  "Tyla": "Tyla_(singer)", "Usain Bolt": "Usain_Bolt",
  "Ana de Armas": "Ana_de_Armas", "Kevin Hart": "Kevin_Hart",
  "Charli XCX": "Charli_XCX", "The Weeknd": "The_Weeknd",
  "Jenna Ortega": "Jenna_Ortega", "Snoop Dogg": "Snoop_Dogg",
  "Billie Holiday": "Billie_Holiday", "Travis Scott": "Travis_Scott",
  "Millie Bobby Brown": "Millie_Bobby_Brown", "Jack Black": "Jack_Black",
  "Anya Taylor-Joy": "Anya_Taylor-Joy", "J. Cole": "J._Cole",
  "Hailee Steinfeld": "Hailee_Steinfeld", "Adam Sandler": "Adam_Sandler",
  "Madison Beer": "Madison_Beer", "21 Savage": "21_Savage",
  "Rachel Zegler": "Rachel_Zegler", "Danny DeVito": "Danny_DeVito",
  "Camila Cabello": "Camila_Cabello", "Tyler, the Creator": "Tyler,_the_Creator",
  "Lupita Nyong'o": "Lupita_Nyong%27o", "Oprah Winfrey": "Oprah_Winfrey",
  "Lil Nas X": "Lil_Nas_X", "Reese Witherspoon": "Reese_Witherspoon",
  "Bruno Mars": "Bruno_Mars", "Awkwafina": "Awkwafina"
};
