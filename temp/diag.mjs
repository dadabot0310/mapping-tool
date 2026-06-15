// 临时诊断脚本 — 测试 Supabase 连接与表访问
const supabaseUrl = "https://fkvwoweyllytaycutycc.supabase.co";
const supabaseAnonKey = "sb_publishable_KrF8jdlXYV-qnrKT0hHgZQ_laJqqzZ_";

async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const tables = ["positions", "companies", "candidates", "feedbacks"];
  for (const table of tables) {
    console.log(`\n--- 测试表: ${table} ---`);
    try {
      const r = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      console.log("status:", r.status, r.statusText);
      console.log("error:", JSON.stringify(r.error));
      console.log("data:", JSON.stringify(r.data));
      if (r.error) {
        console.log(`  code=${r.error.code}, message=${JSON.stringify(r.error.message)}, details=${r.error.details}, hint=${r.error.hint}`);
      } else {
        console.log(`  成功 — 表存在，行数=${r.count}`);
      }
    } catch (e) {
      console.log(`异常:`, e);
    }
  }
}

main().catch(console.error);
