import Moment from '@utils/moment';
import { Model, QueryBuilder, Transaction } from 'objection';

export default class BaseRepository {
  protected moment = Moment;

  /**
   * Get current timestamp formatted
   */
  protected getNow(): string {
    return this.moment.init().utc().format('YYYY-MM-DD HH:mm:ss');
  }

  /**
   * Execute query within transaction
   */
  protected async withTransaction<T>(
    callback: (trx: Transaction) => Promise<T>,
    existingTrx?: Transaction
  ): Promise<T> {
    if (existingTrx) {
      return await callback(existingTrx);
    }

    return await Model.transaction(async (trx) => {
      return await callback(trx);
    });
  }

  /**
   * Build pagination query
   */
  protected paginate<T extends Model>(
    query: QueryBuilder<T>,
    page: number,
    pageSize: number
  ): QueryBuilder<T, any> {
    return query.page(page - 1, pageSize);
  }

  /**
   * Safe JSON parse with fallback
   */
  protected safeJsonParse<T = any>(value: string | null | undefined, fallback: T): T {
    if (!value) return fallback;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  /**
   * Build search condition (ILIKE)
   */
  protected buildSearchCondition(
    query: QueryBuilder<any>,
    fields: string[],
    searchTerm?: string
  ): QueryBuilder<any> {
    if (!searchTerm) return query;

    return query.where((builder) => {
      fields.forEach((field, index) => {
        if (index === 0) {
          builder.whereILike(field, `%${searchTerm}%`);
        } else {
          builder.orWhereILike(field, `%${searchTerm}%`);
        }
      });
    });
  }

  /**
   * Soft delete helper
   */
  protected async softDelete<T extends Model>(
    model: { query: () => QueryBuilder<T> },
    id: string,
    idColumn = 'uid',
    trx?: Transaction
  ): Promise<number> {
    const query = model.query();
    if (trx) query.transacting(trx);

    return await query
      .patch({
        isDeleted: true,
        deletedAt: this.getNow(),
      } as any)
      .where(idColumn, id);
  }

  /**
   * Restore soft deleted record
   */
  protected async restore<T extends Model>(
    model: { query: () => QueryBuilder<T> },
    id: string,
    idColumn = 'uid',
    trx?: Transaction
  ): Promise<number> {
    const query = model.query();
    if (trx) query.transacting(trx);

    return await query
      .patch({
        isDeleted: false,
        deletedAt: null,
      } as any)
      .where(idColumn, id);
  }

  /**
   * Batch insert with conflict handling
   */
  protected async batchUpsert<T extends Model>(
    model: { query: () => QueryBuilder<T> },
    data: any[],
    conflictColumns: string[],
    updateColumns?: string[],
    trx?: Transaction
  ): Promise<T[]> {
    if (data.length === 0) return [];

    const query = model.query();
    if (trx) query.transacting(trx);

    return await query
      .insert(data)
      .onConflict(conflictColumns)
      .merge(updateColumns);
  }

  /**
   * Find by multiple IDs
   */
  protected async findByIds<T extends Model>(
    model: { query: () => QueryBuilder<T> },
    ids: string[],
    idColumn = 'uid'
  ): Promise<T[]> {
    if (ids.length === 0) return [];

    return await model.query()
      .whereIn(idColumn, ids);
  }

  /**
   * Check if record exists
   */
  protected async exists<T extends Model>(
    model: { query: () => QueryBuilder<T> },
    conditions: Record<string, any>
  ): Promise<boolean> {
    const result = await model.query()
      .where(conditions)
      .resultSize();

    return result > 0;
  }
}
