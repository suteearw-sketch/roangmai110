> เอกสารรอบก่อน: ข้อกำหนด 2D และการเลือกตัวละครถูกแทนด้วยคำสั่ง 3D ล่าสุดแล้ว ดู [OFFICE_3D_HANDOFF_TH.md](OFFICE_3D_HANDOFF_TH.md) ส่วนข้อมูล backend/production limitations ด้านล่างยังใช้ได้

# ส่งมอบการแก้ไขโรงไม้110 — 2 พฤศจิกายน 2026

## ฐานซอร์สและสิ่งที่ยังยืนยันไม่ได้

อ่าน CODEX_PROMPT_TH.md ใน ZIP ฉบับ Under32MB ครบ รวมคำอธิบายแทนวิดีโอ และดูภาพ references ทั้ง 3 ภาพแล้ว ใช้แถวที่ 3 เป็นทิศทาง 2D ใช้ภาพเกราะ/ฮู้ดเขียวเป็นแนว Boos และภาพ Marvel สำหรับตัวเลือกตัวละคร วาดฉาก เฟอร์นิเจอร์ ตัวละครและหมาเป็น SVG แยกชั้นใหม่ ไม่คัดลอกภาพอ้างอิงมาทับฉาก

นำ original-source มาต่อยอดใน `/workspace/roangmai110` โดยไม่สร้างโครงการหรือ Site ใหม่ ไม่สร้าง worktree เก็บต้นฉบับไว้ที่ `/workspace/handoff/original-source` เพื่อเทียบการแก้ไข

- ZIP SHA-256: `2a662a25f9d343b6d7e9acda139c493841399f9ec95343edb5f644565a676ed9`
- Commit ที่เอกสารส่งมอบระบุ: `199eb3aea86e9cc08df4b871581bb6c8dc1c34c9` ไม่มี Git history ใน ZIP จึงยังพิสูจน์ commit นี้จาก Git ไม่ได้
- ตรวจ GitHub main จริงด้วย `git ls-remote` ได้ `119920fe16037fb457bf3858c04c2b2308fbe685` ตรงกับ checkout ซึ่งมี README เพียงไฟล์เดียว จึงไม่ใช่หลักฐานว่า source ตรงกับ Sites v22
- ไม่มีเครื่องมือ/สิทธิ์ Sites ใน session นี้ จึงยังตรวจ source/version/audience/automation/infrastructure ของเว็บจริงไม่ได้ **ยังไม่ได้ deploy** ต้องอ่าน source ล่าสุดจาก project เดิมแล้ว merge patch นี้ก่อน staging/deploy ห้ามนำ snapshot นี้ทับ live source โดยตรง
- `.openai/hosting.json`, app authentication, worker connector binding, API/MCP เดิม, seed ธุรกิจ, public assets และ migrations 0000–0002 ยังคงเดิม ไม่มีการเข้าถึงหรือแก้ production DB/R2

## สิ่งที่แก้

1. `app/office-room.tsx`, `app/hero-art.tsx`, `lib/office-paths.ts`, `lib/office-time.ts`: ฉากมุมสูงเฉียงแบบ SVG แยกชั้น มี Boos, ทีม 5 คน, หมาตามทางเดิน, แสง civil time Bangkok, zoom/scroll, หยุดและ reduced motion การเดินไม่ถูกใช้เป็นหลักฐานว่าโมเดลทำงาน
2. `lib/office.ts`, preferences API: ผู้จัดการเป็น Iron Man แน่นอน อีก 4 ฝ่ายเป็นตัวเลือกที่ผู้ใช้บันทึกเอง คง preference เก่าในฐานข้อมูล ไม่อ้างว่าผู้ใช้เลือก Marvel ตัวอื่นแล้ว
3. `app/department-chat.tsx`, `app/live-office.tsx`: ประวัติคำสั่ง/ผลงานแยกฝ่ายจาก server เดิม เปิดแชทข้างฉาก; ใช้ไฟล์และลิงก์จริง ระบบยังไม่สร้างคำตอบเมื่อโมเดลไม่พร้อม
4. `app/api/ai/revise`, `app/api/records/history`, migration 0003: แก้โจทย์ใน task เดิม เก็บ payload เก่าเป็น revision, UUID ป้องกัน retry ซ้ำ, expectedVersion ป้องกัน stale write, ยกเลิก lease/job เก่า ไม่เขียนผลเก่าทับใหม่ Index task เปลี่ยนเป็น nonunique เพื่อเก็บ job history ของหลาย revision
5. `lib/ai-jobs.ts`, `lib/processing-limits.ts`, `lib/autonomous.ts`: ใช้ worker/queue เดิม ไม่เพิ่ม scheduler ซ้อน พักการเริ่มงาน 00:00–05:00 และไม่ต่อ chain ระหว่างพัก รับผลคำขอเดิมได้ มีเพดาน API แบบ reservation บน D1, concurrency และ output tokens ค่า API cap เริ่ม 0 จนกำหนด ไม่มีการอนุมัติงบจากคำว่า 19 ชั่วโมง
6. `lib/executive-queue.ts`, `lib/executive-notifications.ts`, `app/executive-summary.tsx`: ตรวจ manager source versions ก่อนถือเป็นผลงานผ่านเลขา ตัดงานถูกตีกลับ/แหล่งข้อมูล stale ไม่แจ้งสำเร็จจากทุกข้อความดิบ แจ้งแยก exact revision เปิด revision เก่าจากประวัติได้
7. `app/arm-inbox.tsx`, documents/read API: ค้นเอกสาร กรองอ่านแล้ว/ยังไม่อ่าน สถานะอ่านผูกกับ revision และเก็บบน server
8. `app/prospect-directory.tsx`, `lib/prospect-table.ts`, records API: แยกชื่อผู้ติดต่อ ตำแหน่ง โทร LINE อีเมล เว็บ แหล่งข้อมูล วันที่ตรวจ สถานะ พื้นที่และขั้นถัดไป ค้น/กรอง/เพิ่ม/แก้ไขได้ ให้ทะเบียน CRM มาก่อนงานวิจัย ไม่สร้างเบอร์หรือรายชื่อ production ปลอม สถานะติดต่อ/นัด/ตกลงต้องมีหลักฐานอาร์ม ปุ่มต้นฉบับเปิด editor เดิมที่มีการลบด้วย version guard
9. `app/work-input.tsx`, `lib/attachments.ts`: progress อัปโหลดจริงจาก XHR; ส่ง PDF/Excel/ข้อความ/ภาพให้โมเดลที่รองรับ รูปภาพไม่ถูกอ้างว่าอ่านแล้วก่อนมีผลจริง Word/PowerPoint ยังคงเก็บและดาวน์โหลดได้แต่ไม่อ่านอัตโนมัติ
10. `lib/report-*`, `lib/reports.ts`, reports API, `app/report-settings.tsx`, migration 0004: PDF server ด้วย pdfmake+Sarabun ฝังฟอนต์ไทย; 24 ชั่วโมงถึงรายงานแรก; ส่งซ้ำเริ่มเป็น null; auto-email เริ่มปิด; กิจกรรม owner มาจากการเปิดหน้า visible ที่มี focus และ pointer/keyboard/focus จริง ไม่ใช่ polling; delivery state, lease, retry และ idempotency key ไป Resend ผู้รับคงเป็น sutee.arw@gmail.com

## ผลตรวจ

- Frozen pnpm install และติดตั้งซ้ำผ่าน โดยตรวจ integrity/supply-chain ตามค่าเดิม ไม่ปิด TLS/checksum
- TypeScript `tsc --noEmit` ผ่าน; production `pnpm build` ผ่าน
- ชุดทดสอบ Node รวม **80 tests ผ่านทั้งหมด** (รวม parent tests; ไม่มี skipped) ครอบคลุม API/auth/origin, schema/concurrency, queue/lease/retry/unknown submission, revision, manager gate, notification dedup, contacts เดิม, PDF/Excel/ภาพ และ worker client
- เวลา Bangkok 04:59/05:00/23:59/00:00 ผ่าน คิวพักก่อนเริ่มคำขอและยัง poll request เดิมหลังเที่ยงคืน
- ตรวจทุก segment ของเส้นทางตัวละคร/หมาไม่เข้าเขตเฟอร์นิเจอร์ที่กำหนด
- ทดสอบ SQLite migrations ตั้งแต่ 0000–0004 และ rollback/restore โดยรักษา payload/history และไม่ทับรายการที่แก้หลัง rollback ผ่าน
- `setup-local.mjs` ใช้ D1 จำลองจริงผ่าน รันซ้ำรายงาน No migrations to apply
- Chromium desktop/mobile: ตัวละคร 5 คน, คลิกเปิดแชท, ประวัติหลัง reload, แยกแผนก, อัปโหลด CSV, แก้ revision, เพิ่มแบรนด์/โหลดกลับ, defaults รายงานปิด, reduced motion, ไม่มี page overflow; ไม่มี page errors
- เรียก PDF endpoint ใน workerd dev จริงได้ HTTP 200; `pdftotext` อ่านข้อความไทยได้ ฟอนต์ฝังในไฟล์ ไม่ดึง font ผ่าน network ตอนสร้าง PDF
- email test ใช้ fetch mock: 503 → retry ด้วย key เดิม → sent → ไม่ส่งซ้ำ **ไม่มีการส่งอีเมลจริง**
- การทดสอบ backend ทำได้โดยไม่มี browser ในชุด integration ที่ใช้ mock provider **ยังไม่ใช่หลักฐานว่า unattended worker บน infrastructure จริงทำงานแล้ว**

ภาพและ PDF ตัวอย่างอยู่ใน ignored `outputs/office-preview.png`, `outputs/office-mobile.png`, `outputs/report-preview.pdf` ฐานข้อมูลที่มี synthetic smoke records เก็บแยกใน ignored `.wrangler/onboarding-smoke-state` แล้วสร้าง local state ใหม่ก่อนส่งมอบ ไม่มีข้อมูลทดสอบใหม่ใส่ seed หรือ production

## เริ่มใช้งานและ migrations

ใช้ checkout เดิมในงาน isolated ที่มีอยู่ ไม่สร้าง worktree เอง ดูคำสั่ง README สำหรับ local

Production ต้อง merge กับ live source ล่าสุดก่อน สร้าง backup ของ D1/R2 เดิม ตรวจ staging กับ project identity และ audience เดิม แล้วใช้ migration workflow ของ Sites เดิม apply เฉพาะ 0003 และ 0004 ที่ยังไม่ apply **ไม่รัน setup-local กับ production** และไม่ apply 0000–0002 ซ้ำ

Migration 0003/0004 เพิ่ม tables/indexes/column และแทน notification triggers ไม่ drop records, uploads, ai_runs, ai_jobs, business data หรือ notifications เดิม Drizzle snapshots/schema/journal ตรงกัน ตรวจ `drizzle-kit generate` แล้วไม่มี schema diff

Rollback: หยุด worker/auto-email และ snapshot DB ก่อน ใช้ `docs/rollback-office.sql` เก็บ reviewSources/contactDetails เต็มใน office_rollback_payloads, นำเฉพาะ extension keys ออกจาก payload เพื่อให้ schema รุ่นเก่าอ่าน/แก้ได้ และคืน notification triggers เดิม **ไม่ลบตาราง/column/history ใหม่** จากนั้นจึงกลับ app รุ่นก่อน เมื่อต้องการกลับรุ่นนี้ใช้ `docs/restore-office.sql` ซึ่งคืน payload เฉพาะ version ที่ไม่มีการแก้แทรก รายการที่เปลี่ยนแล้วต้อง merge จาก backup เอง ไม่ย้อนข้อมูลใหม่ของอาร์ม Index ai_jobs_task คง nonunique เพื่อรักษาประวัติหลาย revision ไม่สร้าง unique จนล้างประวัติ

## Environment และการเชื่อมต่อที่ยังต้องทำ (ชื่อเท่านั้น)

ตั้งใน secret/runtime settings ของ **Site เดิม** ไม่ใส่ค่าลง source/แชท/frontend:

- OPENAI_API_KEY, OPENAI_MODEL — โมเดลที่รองรับ background Responses, structured output, PDF/ภาพตามการใช้งาน
- AI_WORKER_SECRET — อย่างน้อย 32 ตัวอักษร และตรงกับ continuous receiver
- AI_DAILY_CALL_LIMIT — ค่าเริ่ม 0 ต้องตกลงงบ/เพดานก่อนเปิด อาจกำหนด max calls ต่อ rolling 24 ชั่วโมง ไม่ใช่การรับรองวงเงินสกุลเงิน; ตั้งวงเงินใน provider เพิ่มด้วย
- AI_MAX_CONCURRENCY — 1–4 (default 2), AI_MAX_OUTPUT_TOKENS — 256–16000 (default 7000)
- AI_WEB_SEARCH_ENABLED, AI_AUTONOMY_ENABLED — เปิดเมื่อมีสิทธิ์/งบ/ตรวจ scheduler เดิมแล้ว
- REPORT_EMAIL_API_KEY, REPORT_EMAIL_FROM — Resend service API credential และ sender/domain ที่ยืนยันแล้ว ไม่ใช้บัญชี Gmail session ของเจ้าของ

continuous receiver host เดิมใช้ RM110_SITE_URL, RM110_SITE_BEARER, RM110_WORKER_SECRET ตาม docs/ai-receiver.md ต้องเป็น service access ที่รองรับ private Site เดิม ไม่เปลี่ยน audience และไม่ส่ง cookie ส่วนตัว ก่อนเริ่ม receiver ให้ตรวจ linked automation และ scheduler ภายนอกเดิมทั้งหมดเพื่อไม่เปิดซ้อน

ตรวจ API allowlist ของ Site สำหรับ api.openai.com และ api.resend.com; การอนุญาต network ของ cloud development environment ไม่ได้เปิดสิทธิ์ production Site ให้อัตโนมัติ

ก่อนเปิดจริง ต้องทดสอบ model/research, worker หลังปิด browser, restart/lease/log, current production bindings, staging และ email sandbox ด้วยบัญชีที่มีสิทธิ์และงบ ระบบปัจจุบันจึงแสดง readiness แต่ละส่วนแยก ไม่รวมว่า connected ทั้งหมด

## ค่าที่ยังรอเจ้าของ

เลือกตัวละครอีก 4 ฝ่ายได้ใน UI โดย Iron Man ผู้จัดการล็อกแล้ว ส่ง PDF ครั้งแรกล็อก 24 ชั่วโมงแล้ว ส่วนความถี่ซ้ำเริ่มไม่ส่งจนเลือกบันทึก ช่องทางภายนอกเพิ่มเติมยังไม่ตั้ง ไม่ใช้พิกัดเดาสำหรับพระอาทิตย์ขึ้นตก (แสงใช้เวลา Bangkok แบบต่อเนื่อง) งบ API ยังต้องกำหนดก่อนเริ่มเรียกจริง
