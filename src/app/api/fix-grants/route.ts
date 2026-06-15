import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET() {
  const dbHost = process.env.SUPABASE_DB_HOST || "db.fkvwoweyllytaycutycc.supabase.co";
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || "";
  const dbPort = parseInt(process.env.SUPABASE_DB_PORT || "5432");

  if (!dbPassword) {
    return NextResponse.json({ 
      success: false, 
      error: "SUPABASE_DB_PASSWORD 未设置" 
    }, { status: 500 });
  }

  const pool = new Pool({
    host: dbHost,
    port: dbPort,
    database: "postgres",
    user: "postgres",
    password: dbPassword,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  const results: string[] = [];

  try {
    const client = await pool.connect();
    results.push("已连接到 Supabase 数据库");

    const grants = [
      "GRANT USAGE ON SCHEMA public TO anon, authenticated",
      "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated",
      "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated",
    ];

    for (const sql of grants) {
      try {
        await client.query(sql);
        results.push(`✓ ${sql}`);
      } catch (e: unknown) {
        const err = e as Error;
        results.push(`✗ ${sql}: ${err.message}`);
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
      results,
      verification: rows,
    });
  } catch (e: unknown) {
    const err = e as Error;
    return NextResponse.json({
      success: false,
      error: err.message,
      results,
    }, { status: 500 });
  }
}
