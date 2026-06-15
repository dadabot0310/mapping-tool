import { NextResponse } from "next/server";
import { Pool } from "pg";

// Try multiple connection methods
const DB_CONFIGS = [
  {
    name: "Pooler-Session",
    host: "aws-0-ap-southeast-1.pooler.supabase.com",
    port: 5432,
    user: "postgres.fkvwoweyllytaycutycc",
    ssl: { rejectUnauthorized: false },
  },
  {
    name: "Pooler-Transaction",
    host: "aws-0-ap-southeast-1.pooler.supabase.com",
    port: 6543,
    user: "postgres.fkvwoweyllytaycutycc",
    ssl: { rejectUnauthorized: false },
  },
  {
    name: "Direct-IPv6",
    host: "2600:1f14:90b:6003:c43d:31bb:8a6b:49f0",
    port: 5432,
    user: "postgres",
    ssl: { rejectUnauthorized: false, servername: "db.fkvwoweyllytaycutycc.supabase.co" },
  },
];

export async function GET() {
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || "";

  if (!dbPassword) {
    return NextResponse.json({ 
      success: false, 
      error: "SUPABASE_DB_PASSWORD 未设置" 
    }, { status: 500 });
  }

  let lastError = "";

  for (const config of DB_CONFIGS) {
    const pool = new Pool({
      ...config,
      database: "postgres",
      password: dbPassword,
      connectionTimeoutMillis: 10000,
    });

    try {
      const client = await pool.connect();
      
      const grants = [
        "GRANT USAGE ON SCHEMA public TO anon, authenticated",
        "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated",
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated",
      ];

      const results: string[] = [`通过 ${config.name} 连接成功`];

      for (const sql of grants) {
        try {
          await client.query(sql);
          results.push(`✓ ${sql}`);
        } catch (e: unknown) {
          results.push(`✗ ${sql}: ${(e as Error).message}`);
        }
      }

      // Verify
      const { rows } = await client.query(
        `SELECT table_schema, table_name, privilege_type, grantee 
         FROM information_schema.table_privileges 
         WHERE grantee IN ('anon', 'authenticated') 
         ORDER BY table_name, privilege_type`
      );

      client.release();
      await pool.end();

      return NextResponse.json({
        success: true,
        connection: config.name,
        results,
        verification: rows,
      });
    } catch (e: unknown) {
      lastError = `${config.name}: ${(e as Error).message}`;
      try { await pool.end(); } catch {}
    }
  }

  return NextResponse.json({
    success: false,
    error: `所有连接方式均失败: ${lastError}`,
  }, { status: 500 });
}
