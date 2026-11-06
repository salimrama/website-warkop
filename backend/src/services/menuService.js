const ServiceError = require('./serviceError');

class MenuService {
  constructor(menuRepository) {
    this.menuRepository = menuRepository;
  }

  list(query) {
    return this.menuRepository.findAll({
      includeUnavailable: query.all === '1',
      category: query.category,
    });
  }

  async create(input) {
    const { name, description, price, category = 'drink', image_url } = input;
    if (!name || !price) {
      throw new ServiceError('Nama menu dan harga wajib diisi.', 400);
    }
    if (!['drink', 'food', 'snack'].includes(category)) {
      throw new ServiceError("Kategori harus 'drink', 'food', atau 'snack'.", 400);
    }
    const parsedPrice = Number.parseFloat(price);
    const id = await this.menuRepository.create({
      name,
      description: description || null,
      price: parsedPrice,
      category,
      image_url: image_url || null,
    });
    return {
      id,
      name,
      description,
      price: parsedPrice,
      category,
      image_url,
      is_available: 1,
    };
  }

  async update(id, input) {
    await this.menuRepository.update(id, input);
  }

  async delete(id) {
    await this.menuRepository.delete(id);
  }
}

module.exports = MenuService;
