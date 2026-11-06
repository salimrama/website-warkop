const ServiceError = require('./serviceError');

class TableService {
  constructor(tableRepository) {
    this.tableRepository = tableRepository;
  }

  list(status) {
    return this.tableRepository.findAll(status);
  }

  async getStatus(id) {
    const table = await this.tableRepository.findById(id);
    if (!table) throw new ServiceError('Meja tidak ditemukan.', 404);
    return table;
  }

  async unlock(id) {
    const table = await this.tableRepository.findDetailsById(id);
    if (!table) throw new ServiceError('Meja tidak ditemukan.', 404);
    await this.tableRepository.setAvailable(id);
    return table;
  }

  async completeSession(id) {
    const table = await this.tableRepository.findById(id);
    if (!table) throw new ServiceError('Meja tidak ditemukan.', 404);
    await this.tableRepository.setAvailable(id);
    return table;
  }
}

module.exports = TableService;
