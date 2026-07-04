// ============================================================
// Tashyeed — Supabase Database Wrapper
// Replaces Prisma with Supabase client (REST API mode)
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mpdqzcllhxxxbigcpmtf.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Server-side client — uses service_role key if available, otherwise anon key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey

function createServerClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
  })
}

// Singleton for server-side
let _serverClient: SupabaseClient | null = null
function getServerClient(): SupabaseClient {
  if (!_serverClient) _serverClient = createServerClient()
  return _serverClient
}

// ── Key Transform Utilities ──────────────────────────────────

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function transformKeysToSnake<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(transformKeysToSnake) as T
  if (typeof obj === 'object' && obj instanceof Date) return obj
  if (typeof obj !== 'object') return obj
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[toSnakeCase(key)] = transformKeysToSnake(value)
  }
  return result as T
}

function transformKeysToCamel<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(transformKeysToCamel) as T
  if (obj instanceof Date) return obj
  if (typeof obj !== 'object') return obj
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[toCamelCase(key)] = transformKeysToCamel(value)
  }
  return result as T
}

// ── Where Clause Builder ─────────────────────────────────────

type WhereValue = string | number | boolean | null | Date | WhereValue[] | Record<string, unknown>
type WhereClause = Record<string, WhereValue | WhereClause>

function buildFilters(query: any, where: WhereClause): any {
  for (const [key, value] of Object.entries(where)) {
    const snakeKey = toSnakeCase(key)

    if (value === null) {
      query = query.is(snakeKey, null)
      continue
    }

    if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      // Handle operators like { in: [...] }, { gt: ... }, { not: ... }
      for (const [op, opVal] of Object.entries(value as Record<string, unknown>)) {
        switch (op) {
          case 'in':
            query = query.in(snakeKey, opVal as (string | number | boolean)[])
            break
          case 'not':
            query = query.neq(snakeKey, opVal as string | number | boolean)
            break
          case 'gt':
            query = query.gt(snakeKey, opVal as string | number | boolean)
            break
          case 'gte':
            query = query.gte(snakeKey, opVal as string | number | boolean)
            break
          case 'lt':
            query = query.lt(snakeKey, opVal as string | number | boolean)
            break
          case 'lte':
            query = query.lte(snakeKey, opVal as string | number | boolean)
            break
          default:
            query = query.eq(snakeKey, transformKeysToSnake(opVal))
        }
      }
      continue
    }

    if (Array.isArray(value)) {
      query = query.in(snakeKey, value)
      continue
    }

    if (value instanceof Date) {
      query = query.eq(snakeKey, value.toISOString())
      continue
    }

    query = query.eq(snakeKey, value as string | number | boolean)
  }
  return query
}

// ── Order By Builder ─────────────────────────────────────────

type OrderBy = string | Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>

function applyOrderBy(query: any, orderBy: OrderBy): any {
  if (typeof orderBy === 'string') {
    return query.order(toSnakeCase(orderBy), { ascending: true })
  }
  if (Array.isArray(orderBy)) {
    for (const item of orderBy) {
      for (const [key, dir] of Object.entries(item)) {
        query = query.order(toSnakeCase(key), { ascending: dir === 'asc' })
      }
    }
    return query
  }
  if (typeof orderBy === 'object') {
    for (const [key, dir] of Object.entries(orderBy)) {
      query = query.order(toSnakeCase(key), { ascending: dir === 'asc' })
    }
    return query
  }
  return query
}

// ── Table Wrapper ────────────────────────────────────────────

interface FindManyOptions {
  where?: WhereClause
  include?: Record<string, unknown>
  orderBy?: OrderBy
  take?: number
  select?: Record<string, boolean>
}

interface FindUniqueOptions {
  where: Record<string, string | number>
  include?: Record<string, unknown>
}

interface FindFirstOptions {
  where?: WhereClause
  include?: Record<string, unknown>
  orderBy?: OrderBy
  take?: number
  select?: Record<string, boolean>
}

interface CreateOptions {
  data: Record<string, unknown>
  include?: Record<string, unknown>
}

interface UpdateOptions {
  where: Record<string, string | number>
  data: Record<string, unknown>
  include?: Record<string, unknown>
}

interface UpdateManyOptions {
  where: WhereClause
  data: Record<string, unknown>
}

interface DeleteOptions {
  where: Record<string, string | number>
}

interface DeleteManyOptions {
  where: WhereClause
}

interface CountOptions {
  where?: WhereClause
}

class TableWrapper {
  private tableName: string
  private client: () => SupabaseClient

  constructor(tableName: string, client: () => SupabaseClient) {
    this.tableName = tableName
    this.client = client
  }

  private get supabase() {
    return this.client()
  }

  async findMany(options: FindManyOptions = {}): Promise<any[]> {
    let query = this.supabase.from(this.tableName).select('*')

    if (options.where) {
      query = buildFilters(query, options.where)
    }

    if (options.orderBy) {
      query = applyOrderBy(query, options.orderBy)
    }

    if (options.take) {
      query = query.limit(options.take)
    }

    const { data, error } = await query
    if (error) {
      console.error(`[DB] findMany error on ${this.tableName}:`, error.message)
      return []
    }

    let results = (data || []).map((row: any) => transformKeysToCamel(row))

    // Handle includes by making separate queries
    if (options.include && results.length > 0) {
      results = await this.resolveIncludes(results, options.include)
    }

    return results
  }

  async findUnique(options: FindUniqueOptions): Promise<any | null> {
    let query = this.supabase.from(this.tableName).select('*')

    for (const [key, value] of Object.entries(options.where)) {
      query = query.eq(toSnakeCase(key), value)
    }

    const { data, error } = await query.limit(1).single()
    if (error || !data) {
      if (error?.code !== 'PGRST116') {
        console.error(`[DB] findUnique error on ${this.tableName}:`, error?.message)
      }
      return null
    }

    let result = transformKeysToCamel(data)

    if (options.include) {
      const resolved = await this.resolveIncludes([result], options.include)
      result = resolved[0]
    }

    return result
  }

  async findFirst(options: FindFirstOptions = {}): Promise<any | null> {
    let query = this.supabase.from(this.tableName).select('*')

    if (options.where) {
      query = buildFilters(query, options.where)
    }

    if (options.orderBy) {
      query = applyOrderBy(query, options.orderBy)
    }

    const { data, error } = await query.limit(1)
    if (error || !data || data.length === 0) {
      if (error) console.error(`[DB] findFirst error on ${this.tableName}:`, error.message)
      return null
    }

    let result = transformKeysToCamel(data[0])

    if (options.include) {
      const resolved = await this.resolveIncludes([result], options.include)
      result = resolved[0]
    }

    return result
  }

  async create(options: CreateOptions): Promise<any> {
    const snakeData = transformKeysToSnake(options.data)
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(snakeData)
      .select('*')
      .single()

    if (error) {
      console.error(`[DB] create error on ${this.tableName}:`, error.message, snakeData)
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`)
    }

    let result = transformKeysToCamel(data)

    if (options.include) {
      const resolved = await this.resolveIncludes([result], options.include)
      result = resolved[0]
    }

    return result
  }

  async createMany(options: { data: Record<string, unknown>[] }): Promise<any> {
    const snakeData = options.data.map((d) => transformKeysToSnake(d))
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(snakeData)
      .select('*')

    if (error) {
      console.error(`[DB] createMany error on ${this.tableName}:`, error.message)
      throw new Error(`Failed to create many ${this.tableName}: ${error.message}`)
    }

    return (data || []).map((row: any) => transformKeysToCamel(row))
  }

  async update(options: UpdateOptions): Promise<any> {
    const snakeData = transformKeysToSnake(options.data)
    let query = this.supabase.from(this.tableName).update(snakeData).select('*')

    for (const [key, value] of Object.entries(options.where)) {
      query = query.eq(toSnakeCase(key), value)
    }

    const { data, error } = await query
    if (error) {
      console.error(`[DB] update error on ${this.tableName}:`, error.message)
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`)
    }

    if (!data || data.length === 0) {
      throw new Error(`No record found to update in ${this.tableName}`)
    }

    let result = transformKeysToCamel(data[0])

    if (options.include) {
      const resolved = await this.resolveIncludes([result], options.include)
      result = resolved[0]
    }

    return result
  }

  async updateMany(options: UpdateManyOptions): Promise<any> {
    const snakeData = transformKeysToSnake(options.data)
    let query = this.supabase.from(this.tableName).update(snakeData)

    if (options.where) {
      query = buildFilters(query, options.where)
    }

    const { error } = await query
    if (error) {
      console.error(`[DB] updateMany error on ${this.tableName}:`, error.message)
      throw new Error(`Failed to updateMany ${this.tableName}: ${error.message}`)
    }

    return { count: 0 }
  }

  async delete(options: DeleteOptions): Promise<any> {
    let query = this.supabase.from(this.tableName).delete()

    for (const [key, value] of Object.entries(options.where)) {
      query = query.eq(toSnakeCase(key), value)
    }

    const { error } = await query
    if (error) {
      console.error(`[DB] delete error on ${this.tableName}:`, error.message)
      throw new Error(`Failed to delete from ${this.tableName}: ${error.message}`)
    }

    return {}
  }

  async deleteMany(options: DeleteManyOptions): Promise<any> {
    let query = this.supabase.from(this.tableName).delete()

    if (options.where) {
      query = buildFilters(query, options.where)
    }

    const { error } = await query
    if (error) {
      console.error(`[DB] deleteMany error on ${this.tableName}:`, error.message)
      throw new Error(`Failed to deleteMany from ${this.tableName}: ${error.message}`)
    }

    return {}
  }

  async count(options: CountOptions = {}): Promise<number> {
    let query = this.supabase.from(this.tableName).select('*', { count: 'exact', head: true })

    if (options.where) {
      query = buildFilters(query, options.where)
    }

    const { count, error } = await query
    if (error) {
      console.error(`[DB] count error on ${this.tableName}:`, error.message)
      return 0
    }

    return count || 0
  }

  // ── Resolve Includes (relations) ──────────────────────────
  private async resolveIncludes(
    results: any[],
    include: Record<string, unknown>,
  ): Promise<any[]> {
    const resolvedResults = [...results]

    for (const [relationName, relationConfig] of Object.entries(include)) {
      const snakeRelation = toSnakeCase(relationName)

      // Map relation names to table names
      const relationTableMap: Record<string, string> = {
        planSteps: 'plan_steps',
        planStep: 'plan_steps',
        milestones: 'milestones',
        tasks: 'tasks',
        financials: 'financials',
        notifications: 'notifications',
        chatMessages: 'chat_messages',
        user: 'users',
        business: 'businesses',
      }

      const tableName = relationTableMap[relationName] || snakeRelation
      const config = typeof relationConfig === 'object' && relationConfig !== null
        ? relationConfig as Record<string, unknown>
        : {}

      // Determine the foreign key
      const foreignKeyMap: Record<string, { column: string; parentColumn: string }> = {
        planSteps: { column: 'business_id', parentColumn: 'id' },
        planStep: { column: 'business_id', parentColumn: 'id' },
        milestones: { column: 'business_id', parentColumn: 'id' },
        tasks: { column: 'business_id', parentColumn: 'id' },
        financials: { column: 'business_id', parentColumn: 'id' },
        user: { column: 'id', parentColumn: 'user_id' },
        sessions: { column: 'user_id', parentColumn: 'id' },
        notifications: { column: 'user_id', parentColumn: 'id' },
        chatMessages: { column: 'user_id', parentColumn: 'id' },
        business: { column: 'id', parentColumn: 'business_id' },
      }

      const fkInfo = foreignKeyMap[relationName] || { column: `${snakeRelation}_id`, parentColumn: 'id' }

      // Collect parent IDs
      const parentIds = resolvedResults
        .map((r) => r[fkInfo.parentColumn])
        .filter(Boolean)

      if (parentIds.length === 0) continue

      // Build relation query
      let relationQuery = this.supabase.from(tableName).select('*').in(fkInfo.column, parentIds)

      // Apply orderBy
      if (config.orderBy) {
        relationQuery = applyOrderBy(relationQuery, config.orderBy as OrderBy)
      }

      // Apply where
      if (config.where) {
        relationQuery = buildFilters(relationQuery, config.where as WhereClause)
      }

      // Apply take/limit
      if (config.take) {
        relationQuery = relationQuery.limit(config.take as number)
      }

      const { data: relationData, error } = await relationQuery

      if (error) {
        console.error(`[DB] resolveIncludes error for ${relationName}:`, error.message)
        continue
      }

      // Transform and attach
      const transformedRelations = (relationData || []).map((row: any) => transformKeysToCamel(row))

      // Attach to parent results
      for (const result of resolvedResults) {
        const parentId = result[fkInfo.parentColumn]
        if (!parentId) continue

        const matching = transformedRelations.filter(
          (r: any) => {
            // For belongs-to (e.g., user on session), match parent's id to child's fk
            if (fkInfo.column === 'id') {
              return r.id === parentId
            }
            return r[fkInfo.parentColumn === 'id' ? 'id' : toCamelCase(fkInfo.column)] === parentId
          },
        )

        // Sort matching relations
        if (config.orderBy && matching.length > 1) {
          const sortKeys = Array.isArray(config.orderBy) ? config.orderBy : [config.orderBy]
          for (const sortKey of sortKeys.reverse()) {
            for (const [sortField, sortDir] of Object.entries(sortKey as Record<string, string>)) {
              matching.sort((a: any, b: any) => {
                if (a[sortField] < b[sortField]) return sortDir === 'asc' ? -1 : 1
                if (a[sortField] > b[sortField]) return sortDir === 'asc' ? 1 : -1
                return 0
              })
            }
          }
        }

        // Assign as array or single object
        if (relationName === 'user' || relationName === 'business' || relationName === 'planStep') {
          result[relationName] = matching[0] || null
        } else {
          result[relationName] = matching
        }
      }
    }

    return resolvedResults
  }
}

// ── Export DB Wrapper ────────────────────────────────────────

export const db = {
  user: new TableWrapper('users', getServerClient),
  session: new TableWrapper('sessions', getServerClient),
  business: new TableWrapper('businesses', getServerClient),
  planStep: new TableWrapper('plan_steps', getServerClient),
  task: new TableWrapper('tasks', getServerClient),
  notification: new TableWrapper('notifications', getServerClient),
  milestone: new TableWrapper('milestones', getServerClient),
  financial: new TableWrapper('financials', getServerClient),
  chatMessage: new TableWrapper('chat_messages', getServerClient),
}

// Export Supabase client for direct use if needed
export const supabase = getServerClient

// Also export as default for backward compatibility
export default db
