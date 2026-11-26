class DataExtractor extends Array {
  static from(rawData) {
    if (!rawData) return new DataExtractor();
    if (Array.isArray(rawData) && Array.isArray(rawData[0])) {
      return new DataExtractor(...rawData[0]); // mysql2 [rows, fields]
    }
    if (Array.isArray(rawData.rows)) {
      return new DataExtractor(...rawData.rows); // pg { rows }
    }
    if (Array.isArray(rawData.recordset)) {
      return new DataExtractor(...rawData.recordset); // mssql { recordset }
    }
    if (Array.isArray(rawData)) {
      return new DataExtractor(...rawData);
    }
    return new DataExtractor();
  }

  isEmpty() {
    return this.length === 0;
  }

  /**
   * 1. Single KvP Object from two columns: { [keyColumn]: valueColumn }
   * Example: data.toKvP('setting_key', 'setting_value')
   * Output:  { theme: 'dark', notifications: 'true' }
   */
  toKvP(keyColumn, valueColumn) {
    return this.reduce((acc, row) => {
      if (row && row[keyColumn] !== undefined) {
        acc[row[keyColumn]] = row[valueColumn] ?? null;
      }
      return acc;
    }, {});
  }

  /**
   * 2. Nested KvP Object indexed by a primary column, keeping only selected columns
   * Example: data.toIndexedKvP('id', ['name', 'email'])
   * Output:  { "1": { name: "Alice", email: "a@test.com" }, "2": { ... } }
   */
  toIndexedKvP(keyColumn, valueColumns = []) {
    return this.reduce((acc, row) => {
      if (!row || row[keyColumn] === undefined) return acc;

      const key = row[keyColumn];
      if (valueColumns.length === 0) {
        acc[key] = { ...row };
      } else {
        acc[key] = this._pickColumns(row, valueColumns);
      }
      return acc;
    }, {});
  }

  /**
   * 3. Array of KvP Objects with only specific columns (supports renaming via alias map)
   * Example: data.extract(['id', 'full_name'])
   * Example with rename: data.extract({ userId: 'id', userName: 'full_name' })
   */
  extract(columns) {
    return Array.from(this, (row) => this._pickColumns(row, columns));
  }

  /**
   * 4. Grouped KvP Object: { [groupColumn]: [ { col1, col2 }, ... ] }
   * Example: data.toGroupedKvP('department', ['id', 'name'])
   * Output:  { IT: [{ id: 1, name: 'Alice' }], HR: [{ id: 2, name: 'Bob' }] }
   */
  toGroupedKvP(groupColumn, valueColumns = []) {
    return this.reduce((acc, row) => {
      const groupKey = row?.[groupColumn] ?? 'unassigned';
      if (!acc[groupKey]) acc[groupKey] = [];

      const item = valueColumns.length > 0
        ? this._pickColumns(row, valueColumns)
        : { ...row };

      acc[groupKey].push(item);
      return acc;
    }, {});
  }

  /**
   * 5. Returns a formatted JSON string of any KvP output
   */
  toJson(pretty = false) {
    return JSON.stringify(Array.from(this), null, pretty ? 2 : 0);
  }

  /**
   * Internal helper to pick/rename columns from a single row
   */
  _pickColumns(row, columns) {
    const result = {};
    if (!row) return result;

    // If passed an array: ['id', 'name']
    if (Array.isArray(columns)) {
      for (const col of columns) {
        if (col in row) result[col] = row[col];
      }
      return result;
    }

    // If passed an alias mapping object: { newKey: 'old_column_name' }
    if (typeof columns === 'object' && columns !== null) {
      for (const [alias, originalCol] of Object.entries(columns)) {
        if (originalCol in row) result[alias] = row[originalCol];
      }
    }
    return result;
  }
}

function extractData(rawData) {
  return DataExtractor.from(rawData);
}

module.exports = {
  DataExtractor,
  extractData,
};