declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    AI_WORKER_SECRET?: string;
    AI_WEB_SEARCH_ENABLED?: string;
    AI_AUTONOMY_ENABLED?: string;
    AI_DAILY_CALL_LIMIT?: string;
    AI_MAX_CONCURRENCY?: string;
    AI_MAX_OUTPUT_TOKENS?: string;
    REPORT_EMAIL_API_KEY?: string;
    REPORT_EMAIL_FROM?: string;
    BUCKET?: R2Bucket;
  }
}
