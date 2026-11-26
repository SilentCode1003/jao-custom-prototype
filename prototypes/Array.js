// custom_prototype/prototypes/Array.js
function pickColumns(row, columns) {
  const result = {};
  if (!row) return result;

  if (Array.isArray(columns)) {
    for (const col of columns) {
      if (col in row) result[col] = row[col];
    }
    return result;
  }

  if (typeof columns === 'object' && columns !== null) {
    for (const [alias, originalCol] of Object.entries(columns)) {
      if (originalCol in row) result[alias] = row[originalCol];
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
      if (row && row[keyColumn] !== undefined) {
        acc[row[keyColumn]] = row[valueColumn] ?? null;
      }
      return acc;
    }, {});
  },
  toIndexedKvP(keyColumn, valueColumns = []) {
    return this.reduce((acc, row) => {
      if (!row || row[keyColumn] === undefined) return acc;
      const key = row[keyColumn];
      acc[key] =
        Array.isArray(valueColumns) && valueColumns.length === 0
          ? { ...row }
          : pickColumns(row, valueColumns);
      return acc;
    }, {});
  },
  extract(columns) {
    return this.map((row) => pickColumns(row, columns));
  },
  toGroupedKvP(groupColumn, valueColumns = []) {
    return this.reduce((acc, row) => {
      const groupKey = row?.[groupColumn] ?? 'unassigned';
      if (!acc[groupKey]) acc[groupKey] = [];
      const item =
        Array.isArray(valueColumns) && valueColumns.length === 0
          ? { ...row }
          : pickColumns(row, valueColumns);
      acc[groupKey].push(item);
      return acc;
    }, {});
  },
  toJson(pretty = false) {
    return JSON.stringify(this, null, pretty ? 2 : 0);
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