/**
 * 20250813-move-serial-number-to-listing.js
 * Migration to move serial_number from catalog (generic product) to listing (individual unit)
 * and add manufacture_date to listing.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const qi = queryInterface;
    await qi.sequelize.transaction(async (t) => {
      const tableInfo = await qi.describeTable('listing');
      if (!tableInfo.serial_number) {
        await qi.addColumn('listing', 'serial_number', { type: Sequelize.STRING }, { transaction: t });
      }
      if (!tableInfo.manufacture_date) {
        await qi.addColumn('listing', 'manufacture_date', { type: Sequelize.DATEONLY, allowNull: true }, { transaction: t });
      }
      await qi.sequelize.query(`UPDATE listing l SET serial_number = c.serial_number
        FROM catalog c
        WHERE l.item_id = c.item_id AND c.serial_number IS NOT NULL
          AND (l.serial_number IS NULL OR l.serial_number = '')`, { transaction: t });
      const catInfo = await qi.describeTable('catalog');
      if (catInfo.serial_number) {
        await qi.removeColumn('catalog', 'serial_number', { transaction: t });
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    const qi = queryInterface;
    await qi.sequelize.transaction(async (t) => {
      const catInfo = await qi.describeTable('catalog');
      if (!catInfo.serial_number) {
        await qi.addColumn('catalog', 'serial_number', { type: Sequelize.STRING }, { transaction: t });
      }
      await qi.sequelize.query(`UPDATE catalog c SET serial_number = l.serial_number
        FROM listing l
        WHERE l.item_id = c.item_id AND l.serial_number IS NOT NULL
          AND (c.serial_number IS NULL OR c.serial_number = '')`, { transaction: t });
      const listInfo = await qi.describeTable('listing');
      if (listInfo.serial_number) {
        await qi.removeColumn('listing', 'serial_number', { transaction: t });
      }
      if (listInfo.manufacture_date) {
        await qi.removeColumn('listing', 'manufacture_date', { transaction: t });
      }
    });
  }
};
