const ServiceError = require('./serviceError');

class DatabaseService {
  constructor(databaseRepository) {
    this.databaseRepository = databaseRepository;
  }

  async readTable(tableName) {
    const result = await this.databaseRepository.readTable(tableName);
    if (!result) throw new ServiceError('Tabel tidak diizinkan untuk ditampilkan.', 400);
    return result;
  }
}

module.exports = DatabaseService;
