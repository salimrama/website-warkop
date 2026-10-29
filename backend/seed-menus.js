require('dotenv').config();
const { pool } = require('./src/config/db');

const dummyMenus = [
  // ── Minuman (Drinks) ─────────────────────────────────────────────────────────
  {
    name: 'Kopi Hitam Tubruk',
    description: 'Kopi robusta khas nusantara, diseduh tubruk kental dan beraroma kuat.',
    price: 6000,
    category: 'drink',
    image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Kopi Susu Gula Aren',
    description: 'Paduan espresso robusta, susu kental manis gurih, dan gula aren asli.',
    price: 12000,
    category: 'drink',
    image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Kopi Tarik Aceh',
    description: 'Kopi pekat khas Aceh ditarik berbusa lembut, rasa manis legit.',
    price: 10000,
    category: 'drink',
    image_url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Es Teh Manis Jumbo',
    description: 'Teh melati wangi khas warkop, disajikan dingin segar porsi besar.',
    price: 5000,
    category: 'drink',
    image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Nutrisari Dingin',
    description: 'Minuman serbuk sari buah jeruk manis asam segar pelepas dahaga.',
    price: 5000,
    category: 'drink',
    image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Soda Gembira',
    description: 'Sirup merah cocopandan, susu kental manis, dan soda segar berbusa.',
    price: 14000,
    category: 'drink',
    image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Wedang Jahe Hangat',
    description: 'Seduhan jahe emprit bakar geprek asli, gula kelapa, dan serai penghangat badan.',
    price: 8000,
    category: 'drink',
    image_url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&auto=format&fit=crop&q=80',
  },

  // ── Makanan (Foods) ──────────────────────────────────────────────────────────
  {
    name: 'Indomie Goreng Internet (Telur Kornet)',
    description: 'Indomie goreng legendaris dengan topping kornet sapi gurih dan telur ceplok setengah matang.',
    price: 15000,
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Indomie Kuah Kari Ayam Spesial',
    description: 'Indomie kuah rasa kari ayam pekat dengan telur rebus, sawi hijau, dan irisan cabai rawit.',
    price: 13000,
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Nasi Goreng Gila Warkop',
    description: 'Nasi goreng harum rempah bertabur tumisan sosis, bakso, ayam suwir, dan sayuran.',
    price: 18000,
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Magelangan Warkop (Nasi + Mie)',
    description: 'Kombinasi nasi dan mie goreng berbumbu racikan khas warkop, porsi mantap mengenyangkan.',
    price: 17000,
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Nasi Ayam Geprek Sambal Korek',
    description: 'Ayam crispy digeprek dengan cabai rawit pedas nampol, disajikan dengan nasi hangat dan lalapan.',
    price: 20000,
    category: 'food',
    image_url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&auto=format&fit=crop&q=80',
  },

  // ── Camilan (Snacks) ─────────────────────────────────────────────────────────
  {
    name: 'Roti Bakar Coklat Keju',
    description: 'Roti tawar tebal dipanggang renyah isi meses coklat melimpah dan taburan keju cheddar parut.',
    price: 13000,
    category: 'snack',
    image_url: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pisang Goreng Keju Aren',
    description: 'Pisang kepok manis digoreng krispi dengan limpahan susu kental manis, keju parut, dan gula aren.',
    price: 12000,
    category: 'snack',
    image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cireng Crispy Bumbu Rujak',
    description: 'Cireng kenyal renyah di luar, disajikan dengan cocolan saus sambal rujak asam manis pedas.',
    price: 10000,
    category: 'snack',
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80',
  },
  {
    name: 'Kentang Goreng French Fries',
    description: 'Kentang goreng renyah bumbu gurih asin, disajikan lengkap dengan saus sambal dan mayones.',
    price: 12000,
    category: 'snack',
    image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80',
  },
];

async function seedMenus() {
  console.log('🍽️ Menambahkan menu dummy warkop...');

  try {
    let inserted = 0;
    for (const menu of dummyMenus) {
      // Periksa apakah menu sudah ada berdasarkan nama
      const [[existing]] = await pool.query('SELECT id FROM menus WHERE name = ?', [menu.name]);

      if (!existing) {
        await pool.query(
          `INSERT INTO menus (name, description, price, category, image_url, is_available)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [menu.name, menu.description, menu.price, menu.category, menu.image_url]
        );
        inserted++;
      }
    }

    console.log(`✅ Berhasil menambahkan ${inserted} menu baru! (Total menu dummy: ${dummyMenus.length})`);
    console.log('📋 Kategori:');
    console.log('- Minuman : Kopi Hitam, Kopi Susu Aren, Kopi Tarik, Es Teh, Nutrisari, Soda Gembira, Wedang Jahe');
    console.log('- Makanan : Indomie Internet, Indomie Kuah Kari, Nasi Goreng Gila, Magelangan, Nasi Ayam Geprek');
    console.log('- Camilan : Roti Bakar, Pisang Goreng, Cireng Rujak, Kentang Goreng');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal menambahkan menu dummy:', err.message || err);
    process.exit(1);
  }
}

seedMenus();

