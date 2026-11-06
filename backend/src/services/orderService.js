const ServiceError = require('./serviceError');

const VALID_STATUSES = ['pending', 'processing', 'completed', 'cancelled'];

class OrderService {
  constructor(orderRepository, userRepository) {
    this.orderRepository = orderRepository;
    this.userRepository = userRepository;
  }

  async create(input) {
    const { table_id: tableId, notes, items } = input;
    if (!tableId) throw new ServiceError('table_id wajib diisi.', 400);
    if (!Array.isArray(items) || items.length === 0) {
      throw new ServiceError('items tidak boleh kosong.', 400);
    }
    for (const [index, item] of items.entries()) {
      if (!item.menu_id || !item.quantity || item.quantity < 1) {
        throw new ServiceError(
          `Item ke-${index + 1}: menu_id dan quantity (min 1) wajib diisi.`,
          400
        );
      }
    }

    try {
      const result = await this.orderRepository.withTransaction(async (repository) => {
        const table = await repository.findTableForOrder(tableId);
        if (!table) throw new ServiceError('Meja tidak ditemukan.', 404);

        const menuIds = [...new Set(items.map((item) => item.menu_id))];
        const menuRows = await repository.findAvailableMenus(menuIds);
        const menus = new Map(menuRows.map((menu) => [menu.id, menu]));
        for (const item of items) {
          if (!menus.has(item.menu_id)) {
            throw new ServiceError(
              `Menu dengan id ${item.menu_id} tidak ditemukan atau tidak tersedia.`,
              404
            );
          }
        }

        const orderItems = items.map((item) => {
          const menu = menus.get(Number(item.menu_id));
          const unitPrice = Number.parseFloat(menu.price);
          return {
            menu_id: item.menu_id,
            menu_name: menu.name,
            quantity: item.quantity,
            unit_price: unitPrice,
            subtotal: unitPrice * item.quantity,
            notes: item.notes || null,
          };
        });
        const totalPrice = orderItems.reduce((total, item) => total + item.subtotal, 0);
        const orderId = await repository.insertOrder({
          tableId,
          totalPrice,
          notes: notes || null,
        });
        await repository.insertOrderItems(orderId, orderItems);
        await repository.markTableOccupied(tableId);
        return { orderId, table, totalPrice, items: orderItems };
      });
      return {
        response: {
          order_id: result.orderId,
          table_id: tableId,
          table_number: result.table.table_number,
          total_price: result.totalPrice,
          status: 'pending',
          items: result.items.map(({ menu_name, ...item }) => item),
        },
        notification: {
          order_id: result.orderId,
          table_id: tableId,
          table_number: result.table.table_number,
          source: 'customer',
          status: 'pending',
          total_price: result.totalPrice,
          notes: notes || null,
          items: result.items,
          created_at: new Date(),
        },
      };
    } catch (error) {
      if (error.statusCode) throw new ServiceError(error.message, error.statusCode);
      throw error;
    }
  }

  list(status) {
    return this.orderRepository.findAll(status);
  }

  async updateStatus(id, status) {
    if (!VALID_STATUSES.includes(status)) {
      throw new ServiceError(`Status tidak valid. Pilih: ${VALID_STATUSES.join(', ')}`, 400);
    }
    const order = await this.orderRepository.findById(id);
    if (!order) throw new ServiceError('Pesanan tidak ditemukan.', 404);
    await this.orderRepository.updateStatus(id, status);
    return { orderId: Number.parseInt(id, 10), tableId: Number(order.table_id), status };
  }

  async history(query) {
    const { status = 'all', from, to, limit = 50, offset = 0 } = query;
    const parsedLimit = Number.parseInt(limit, 10);
    const parsedOffset = Number.parseInt(offset, 10);
    const result = await this.orderRepository.findHistory({
      status,
      from,
      to,
      limit: parsedLimit,
      offset: parsedOffset,
    });
    return {
      data: result.rows,
      pagination: { total: result.total, limit: parsedLimit, offset: parsedOffset },
    };
  }

  async dashboardStats() {
    const [stats, totalEmployees] = await Promise.all([
      this.orderRepository.getDashboardStats(),
      this.userRepository.countActive(),
    ]);
    return {
      total_orders: stats.total_orders || 0,
      total_revenue: Number.parseFloat(stats.total_revenue) || 0,
      orders_today: stats.orders_today || 0,
      revenue_today: Number.parseFloat(stats.revenue_today) || 0,
      total_employees: totalEmployees,
      pending_orders: stats.pending_orders,
    };
  }
}

module.exports = OrderService;
