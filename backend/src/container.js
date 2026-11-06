const { pool } = require('./config/db');

const MenuRepository = require('./repositories/menuRepository');
const TableRepository = require('./repositories/tableRepository');
const AuthRepository = require('./repositories/authRepository');
const UserRepository = require('./repositories/userRepository');
const DatabaseRepository = require('./repositories/databaseRepository');
const OrderRepository = require('./repositories/orderRepository');
const StatisticsRepository = require('./repositories/statisticsRepository');

const MenuService = require('./services/menuService');
const TableService = require('./services/tableService');
const AuthService = require('./services/authService');
const UserService = require('./services/userService');
const DatabaseService = require('./services/databaseService');
const OrderService = require('./services/orderService');
const StatisticsService = require('./services/statisticsService');

const createMenuController = require('./controllers/menuController');
const createTableController = require('./controllers/tableController');
const createAuthController = require('./controllers/authController');
const createUserController = require('./controllers/userController');
const createDatabaseController = require('./controllers/databaseController');
const createOrderController = require('./controllers/orderController');
const createStatisticsController = require('./controllers/statisticsController');

const repositories = {
  menu: new MenuRepository(pool),
  table: new TableRepository(pool),
  auth: new AuthRepository(pool),
  user: new UserRepository(pool),
  database: new DatabaseRepository(pool),
  order: new OrderRepository(pool),
  statistics: new StatisticsRepository(pool),
};

const services = {
  menu: new MenuService(repositories.menu),
  table: new TableService(repositories.table),
  auth: new AuthService(repositories.auth),
  user: new UserService(repositories.user),
  database: new DatabaseService(repositories.database),
  order: new OrderService(repositories.order, repositories.user),
  statistics: new StatisticsService(repositories.statistics),
};

const controllers = {
  ...createMenuController(services.menu),
  ...createTableController(services.table),
  ...createAuthController(services.auth),
  ...createUserController(services.user),
  ...createDatabaseController(services.database),
  ...createOrderController(services.order),
  ...createStatisticsController(services.statistics),
};

module.exports = { repositories, services, controllers };
