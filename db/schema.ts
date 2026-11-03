import { sqliteTable, text, integer, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', {
  kind: text('kind').notNull(), id: text('id').notNull(), payload: text('payload').notNull(),
  version: integer('version').notNull().default(1), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, t => [primaryKey({ columns: [t.kind, t.id] })]);
export const audit = sqliteTable('audit', {
  id: text('id').primaryKey(), action: text('action').notNull(), title: text('title').notNull(), actor: text('actor').notNull(), createdAt: text('created_at').notNull(),
});
export const aiRuns = sqliteTable('ai_runs', {
  id: text('id').primaryKey(), department: text('department').notNull(), prompt: text('prompt').notNull(),
  status: text('status').notNull(), result: text('result'), actor: text('actor').notNull(), createdAt: text('created_at').notNull(),
});
export const metadata = sqliteTable('metadata', { key: text('key').primaryKey(), value: text('value').notNull() });
export const aiJobs = sqliteTable('ai_jobs', {
  id: text('id').primaryKey(), taskId: text('task_id').notNull(),
  department: text('department').notNull(), prompt: text('prompt').notNull(), actor: text('actor').notNull(),
  state: text('state').notNull().default('queued'), attempt: integer('attempt').notNull().default(0),
  providerId: text('provider_id'), providerState: text('provider_state'), result: text('result'),
  nextAttemptAt: text('next_attempt_at').notNull(), startedAt: text('started_at'), completedAt: text('completed_at'),
  errorCode: text('error_code'), errorMessage: text('error_message'),
  leaseToken: text('lease_token'), leaseUntil: text('lease_until'),
  createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, t => [index('ai_jobs_task').on(t.taskId), index('ai_jobs_due').on(t.state,t.nextAttemptAt)]);
export const aiJobEvents = sqliteTable('ai_job_events', {
  id: text('id').primaryKey(), jobId: text('job_id').notNull(), state: text('state').notNull(),
  message: text('message').notNull(), createdAt: text('created_at').notNull(),
}, t => [index('ai_events_job').on(t.jobId,t.createdAt)]);

export const uploads = sqliteTable('uploads', {
 id:text('id').primaryKey(),name:text('name').notNull(),size:integer('size').notNull(),type:text('type').notNull(),actor:text('actor').notNull(),createdAt:text('created_at').notNull(),
});
export const notifications = sqliteTable('notifications', {
 id:text('id').primaryKey(),recordId:text('record_id').notNull(),kind:text('kind').notNull(),title:text('title').notNull(),message:text('message').notNull(),createdAt:text('created_at').notNull(),readAt:text('read_at'),revision:integer('revision'),
}, t=>[index('notifications_time').on(t.createdAt),uniqueIndex('notifications_revision').on(t.recordId,t.revision)]);

export const aiUsage=sqliteTable('ai_usage',{id:text('id').primaryKey(),jobId:text('job_id').notNull(),createdAt:text('created_at').notNull()},t=>[index('ai_usage_time').on(t.createdAt)]);
export const recordRevisions=sqliteTable('record_revisions',{kind:text('kind').notNull(),recordId:text('record_id').notNull(),version:integer('version').notNull(),payload:text('payload').notNull(),savedAt:text('saved_at').notNull()},t=>[primaryKey({columns:[t.kind,t.recordId,t.version]})]);

export const reportDeliveries=sqliteTable('report_deliveries',{id:text('id').primaryKey(),episode:text('episode').notNull(),state:text('state').notNull(),attempt:integer('attempt').notNull().default(0),leaseUntil:text('lease_until'),leaseToken:text('lease_token'),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),nextAttemptAt:text('next_attempt_at').notNull(),providerId:text('provider_id'),error:text('error')});
