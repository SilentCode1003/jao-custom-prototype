// custom_prototype/prototypes/SchemaExtractor.js
require('./Array');

class SchemaExtractor {
    /**
     * @param {import('sequelize').Sequelize} sequelizeInstance
     */
    constructor(sequelizeInstance) {
        if (!sequelizeInstance || typeof sequelizeInstance.getQueryInterface !== 'function') {
            throw new Error('A valid Sequelize instance is required.');
        }
        this.sequelize = sequelizeInstance;
        this.queryInterface = sequelizeInstance.getQueryInterface();
    }

    /**
     * Lists all table names in the connected database.
     * @param {string[]} [excludeTables=['SequelizeMeta']]
     * @returns {Promise<string[]>}
     */
    async getTables(excludeTables = ['SequelizeMeta']) {
        const rawTables = await this.queryInterface.showAllTables();
        return rawTables
            .map((t) => (typeof t === 'object' ? t.tableName || Object.values(t)[0] : t))
            .filter((tableName) => !excludeTables.includes(tableName));
    }

    /**
     * Extracts columns, primary keys, foreign keys, and indexes for a single live table.
     * @param {string} tableName
     */
    async extractTableSchema(tableName) {
        const [rawColumns, foreignKeys, indexes] = await Promise.all([
            this.queryInterface.describeTable(tableName),
            this.getForeignKeys(tableName),
            this.getIndexes(tableName),
        ]);

        // Leverage your Array.prototype.toIndexedKvP for O(1) foreign key lookups
        const fkByColumn = foreignKeys.toIndexedKvP('columnName', {
            referencedTable: 'referencedTableName',
            referencedColumn: 'referencedColumnName',
            constraintName: 'constraintName',
        });

        const columns = Object.entries(rawColumns).map(([name, meta]) => ({
            name,
            type: meta.type,
            allowNull: Boolean(meta.allowNull),
            defaultValue: meta.defaultValue ?? null,
            primaryKey: Boolean(meta.primaryKey),
            autoIncrement: Boolean(meta.autoIncrement),
            comment: meta.comment || null,
            foreignKey: fkByColumn[name] || null,
        }));

        return {
            tableName,
            columnNames: columns.map((c) => c.name),
            primaryKeys: columns.filter((c) => c.primaryKey).map((c) => c.name),
            columns,
            indexes,
        };
    }

    /**
     * Extracts the full schema across all database tables.
     * @param {Object} [options]
     * @param {string[]} [options.excludeTables=['SequelizeMeta']]
     */
    async extractFullSchema({ excludeTables = ['SequelizeMeta'] } = {}) {
        const tables = await this.getTables(excludeTables);
        const schema = {
            dialect: this.sequelize.getDialect(),
            database: this.sequelize.config.database,
            extractedAt: new Date().toISOString(),
            tables: {},
        };

        for (const tableName of tables) {
            schema.tables[tableName] = await this.extractTableSchema(tableName);
        }

        return schema;
    }

    /**
     * Extracts column metadata directly from a loaded Sequelize Model (code-level, no DB query).
     * @param {import('sequelize').ModelStatic<any>} model
     */
    extractModelSchema(model) {
        if (!model || typeof model.getAttributes !== 'function') {
            throw new Error('A valid Sequelize Model must be provided.');
        }

        const attributes = model.getAttributes();
        const columns = Object.entries(attributes).map(([attributeName, attr]) => ({
            attributeName,
            columnName: attr.field || attr.fieldName || attributeName,
            type: attr.type?.toString() || 'UNKNOWN',
            allowNull: attr.allowNull !== false,
            defaultValue: attr.defaultValue ?? null,
            primaryKey: Boolean(attr.primaryKey),
            autoIncrement: Boolean(attr.autoIncrement),
        }));

        return {
            modelName: model.name,
            tableName: model.getTableName(),
            attributeNames: columns.map((c) => c.attributeName),
            columnNames: columns.map((c) => c.columnName),
            columns,
        };
    }

    /**
     * Dynamically builds a property mapper class from either a Sequelize Model
     * or a live database table name.
     * @param {import('sequelize').ModelStatic<any> | string} modelOrTable
     */
    async createPropertyClass(modelOrTable) {
        let columns = [];

        if (typeof modelOrTable === 'string') {
            const tableSchema = await this.extractTableSchema(modelOrTable);
            columns = tableSchema.columnNames;
        } else {
            const modelSchema = this.extractModelSchema(modelOrTable);
            columns = modelSchema.attributeNames;
        }

        return class DynamicTableProperty {
            constructor(row = {}) {
                const plain = typeof row?.get === 'function' ? row.get({ plain: true }) : (row?.dataValues || row || {});
                for (const col of columns) {
                    this[col] = plain[col] !== undefined ? plain[col] : null;
                }
            }

            static getColumns() {
                return [...columns];
            }
        };
    }

    /**
     * Compares live database columns against registered Sequelize Models to detect drift.
     */
    async findModelDrift() {
        const dbSchema = await this.extractFullSchema();
        const report = [];

        for (const [modelName, model] of Object.entries(this.sequelize.models)) {
            const modelInfo = this.extractModelSchema(model);
            const tableName =
                typeof modelInfo.tableName === 'object' ? modelInfo.tableName.tableName : modelInfo.tableName;
            const dbTable = dbSchema.tables[tableName];

            if (!dbTable) {
                report.push({ modelName, tableName, status: 'MISSING_IN_DB', missingInDb: [], extraInDb: [] });
                continue;
            }

            const missingInDb = modelInfo.columnNames.filter((col) => !dbTable.columnNames.includes(col));
            const extraInDb = dbTable.columnNames.filter((col) => !modelInfo.columnNames.includes(col));

            report.push({
                modelName,
                tableName,
                status: missingInDb.isEmpty() && extraInDb.isEmpty() ? 'IN_SYNC' : 'DRIFT_DETECTED',
                missingInDb,
                extraInDb,
            });
        }

        return report;
    }

    async getForeignKeys(tableName) {
        try {
            if (typeof this.queryInterface.getForeignKeyReferencesForTable === 'function') {
                return await this.queryInterface.getForeignKeyReferencesForTable(tableName);
            }
            return [];
        } catch {
            return [];
        }
    }

    async getIndexes(tableName) {
        try {
            const rawIndexes = await this.queryInterface.showIndex(tableName);
            return rawIndexes.map((idx) => ({
                name: idx.name,
                unique: Boolean(idx.unique),
                primary: Boolean(idx.primary),
                columns: idx.fields.map((f) => f.attribute || f.name),
            }));
        } catch {
            return [];
        }
    }
}

module.exports = SchemaExtractor;