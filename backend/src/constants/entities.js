// entities.js
// Centralized canonical entity name constants used across auditing and controllers.
// These values MUST match the entity column values written into historylogs.
// If a table/model name changes, update here and corresponding models/controllers.

const ENTITY = Object.freeze({
  LISTING: 'listing',
  CATALOG: 'catalog',
  CUSTOMER: 'customer',
  OWNERSHIP: 'ownership',
  SALES: 'sales',
  APPCONFIG: 'appconfig',
  SHIPPING_LOG: 'shippinglog',
  FINANCIAL_TRACKING: 'financialtracking',
  COMMUNICATION_LOGS: 'communicationlogs',
  RETURN_HISTORY: 'returnhistory',
  PERFORMANCE_METRICS: 'performancemetrics',
  ORDER_DETAILS: 'orderdetails', // Note: model/table currently named 'orderdetails' (see technical debt doc)
  DATABASE_CONFIGURATION: 'database_configuration'
});

module.exports = { ENTITY };
