// scripts/seed-prizes.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { prizes } from '../src/lib/schema';

const db = drizzle(new Database('sqlite.db'));

/* insert (synchronous) */
db.insert(prizes)
  .values([
    {
      name: '5x Matchplay Klippekort',
      imageUrl:
        'https://miro.medium.com/v2/resize:fit:720/format:webp/1*NwRgSPakFp5Dj1hMydayzA.jpeg',
    },
    {
      name: 'LUX AT White Sko',
      imageUrl:
        'https://www.wlp.no/wp-content/uploads/2024/09/CALATLUXBLGR_1_eadf4b8fca872c16cbeba36d96a35347.png',
    },
    {
      name: '1500kr gavekort Racket1',
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5TurDShMYJ-Qui7nPBFKGLjavP1RVa-Bb0A&s',
    },
    {
      name: 'Kasse padelballrør',
      imageUrl:
        'https://padelhandelen.no/cdn/shop/files/PremierPadelKasse.webp?v=1740045233',
    },
    {
      name: '1500kr gavekort WLP',
      imageUrl:
        'https://www.wlp.no/wp-content/uploads/2021/03/WLP-gift-card-5.png',
    },
    {
      name: '2x Daypass på The Well Spa',
      imageUrl:'https://thewell.no/media/re2f2g2v/art-deco-3.jpg?width=500&height=900&mode=crop'
    },
    {
      name: 'Vindtunnel for 2',
      imageUrl:'https://back.megafly.tunn3l.com/index.php?ctrl=do&do=show_catalog_pict&catalog_id=46'
    },
    {
      name: '3 stk nuddelkasser',
      imageUrl:
        'https://fodda.no/cdn/shop/files/Kjop-Nongshim-Shin-Ramyun-Japanese-Noodle-10-Pakning_-120g_-Fodda.no-Asiatisk-Nettbutikk-190980021.png?v=1727390590&width=1000',
    },
  ])
  .run(); // <- synchronous; no await needed

console.log('Prizes seeded!');
process.exit(0);
