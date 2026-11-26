// custom_prototype/prototypes/Array.js

/**
 * Normalizes a Sequelize Model instance into its plain column object,
 * or returns plain objects / BaseModelProperty instances as-is.
 */
function normalizeRow(row) {
  if (!row || typeof row !== 'object') return null;
  if (typeof row.get === 'function') {
    return row.get({ plain: true });
  }
  if (row.dataValues && typeof row.dataValues === 'object') {
    return row.dataValues;
  }
  return row;
}

function pickColumns(row, columns) {
  const result = {};
  const plainRow = normalizeRow(row);
  if (!plainRow) return result;

  if (Array.isArray(columns)) {
    for (const col of columns) {
      if (col in plainRow) result[col] = plainRow[col];
    }
    return result;
  }

  if (typeof columns === 'object' && columns !== null) {
    for (const [alias, originalCol] of Object.entries(columns)) {
      if (originalCol in plainRow) result[alias] = plainRow[originalCol];
    }
  }
  return result;
}

const arrayExtensions = {
  isEmpty() {
    return this.length === 0;
  },
  isNotEmpty() {
    return this.length > 0;
  },
  toKvP(keyColumn, valueColumn) {
    return this.reduce((acc, row) => {
      const plainRow = normalizeRow(row);
      if (plainRow && plainRow[keyColumn] !== undefined && plainRow[keyColumn] !== null) {
        acc[plainRow[keyColumn]] = plainRow[valueColumn] ?? null;
      }
      return acc;
    }, {});
  },
  toIndexedKvP(keyColumn, valueColumns = []) {
    return this.reduce((acc, row) => {
      const plainRow = normalizeRow(row);
      if (!plainRow || plainRow[keyColumn] === undefined || plainRow[keyColumn] === null) {
        return acc;
      }
      const key = plainRow[keyColumn];
      acc[key] =
        Array.isArray(valueColumns) && valueColumns.length === 0
          ? { ...plainRow }
          : pickColumns(plainRow, valueColumns);
      return acc;
    }, {});
  },
  extract(columns) {
    return this.map((row) => pickColumns(row, columns));
  },
  toGroupedKvP(groupColumn, valueColumns = []) {
    return this.reduce((acc, row) => {
      const plainRow = normalizeRow(row);
      const groupKey = plainRow?.[groupColumn] ?? 'unassigned';
      if (!acc[groupKey]) acc[groupKey] = [];
      const item =
        Array.isArray(valueColumns) && valueColumns.length === 0
          ? { ...(plainRow || {}) }
          : pickColumns(plainRow, valueColumns);
      acc[groupKey].push(item);
      return acc;
    }, {});
  },
  toJson(pretty = false) {
    const normalized = this.map((row) => normalizeRow(row) ?? row);
    return JSON.stringify(normalized, null, pretty ? 2 : 0);
  },
};

for (const [name, fn] of Object.entries(arrayExtensions)) {
  if (!Array.prototype[name]) {
    Object.defineProperty(Array.prototype, name, {
      value: fn,
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
}

module.exports = Array;