# โรงไม้110 · Private AI office

ต่อยอดจาก `original-source` ของโรงไม้110 โดยคง React / TypeScript / Vinext / Cloudflare Workers, Site project identity, authentication, D1 `DB`, R2 `BUCKET` และ MCP เดิมไว้ ไม่ใช่ Site ใหม่

- ออฟฟิศ Three.js / WebGL 3D แบบเรียลไทม์: หมุน/ซูม/เลื่อนกล้อง คลิกโมเดลเปิดแชท ป้ายตามตัวละคร แสง/เงาตาม Bangkok เส้นทางเดินและน้องหมา โมเดลสร้างใหม่ด้วย geometry
- ตัวละครประจำฝ่าย: Iron Man ผู้จัดการ, Captain America พัฒนาพื้นที่, Thor การเงิน, Hulk การตลาด, Spider-Man เลขา; BOSS คงหน้ากากโลหะ เกราะ ฮู้ดและผ้าคลุมเขียวเข้ม
- แชทและคำสั่งแยกแผนกใช้ records และ durable queue เดิม; แนบ PDF/Excel/ภาพ/ลิงก์; แก้โจทย์เก็บ revision และยกเลิก job เก่า
- งานที่ผู้จัดการตรวจและเลขาคัดแล้วจึงเข้ารายงานสำเร็จ พร้อมตรวจ source version และแจ้งเตือนแยก revision
- ตารางแบรนด์แยกข้อมูลติดต่อ แก้ไขและบันทึกด้วย version guard; สถานะติดต่อแล้วต้องมีหลักฐานของอาร์ม
- worker เดิมพักเริ่มคำขอใหม่ 00:00–05:00 Asia/Bangkok; รับผลคำขอเดิมได้; daily API cap เริ่มที่ **0** จนกำหนดงบ
- PDF ไทยสร้างบน server; อีเมลครั้งแรกหลังไม่ใช้งาน 24 ชั่วโมง; การส่งอัตโนมัติและส่งซ้ำเริ่มปิดไว้

เพิ่มสำนักงานสองชั้น สวน สัตว์ chibi Avengers กระจกเต็มกรอบ ท้องฟ้าตามเวลาไทย และ UI Dark Command Center รายละเอียดอยู่ในเอกสารส่งมอบล่าสุด

**สถานะ production:** ยังไม่ได้ตรวจ live source ของ Sites v22 หรือใหม่กว่า และยังไม่ได้ deploy หรือเชื่อม production D1/R2/model/worker/email อ่าน [ผลส่งมอบ Command Center ล่าสุด](docs/COMMAND_CENTER_HANDOFF_TH.md) และ [รายละเอียดระบบเดิม](docs/CODEX_HANDOFF_TH.md) ก่อนนำขึ้นเว็บจริง

## พัฒนาในเครื่อง

ใช้ checkout เดิมในงานที่แยกสภาพแวดล้อมให้อยู่แล้ว ไม่สร้าง Git worktree เว้นแต่ผู้ใช้ขอ

เครื่องที่ทดสอบ: Node 24.19.0, pnpm 11.25.0, Chromium ระบบ

```sh
cd /workspace/roangmai110
pnpm install --frozen-lockfile --store-dir /workspace/.pnpm-store
node scripts/setup-local.mjs
pnpm dev --host 127.0.0.1 --port 5173
```

`setup-local` ใช้ D1 จำลองเท่านั้นและบันทึก migration history รันซ้ำได้ ห้ามเพิ่ม `--remote` ในคำสั่งนี้ ข้อมูล local อยู่ใน ignored `.wrangler/state` ไม่ใช่ข้อมูล production ใช้การเข้าสู่ระบบ local ของ starter เดิม หน้า production ยังคงต้องเข้าสู่ระบบและ audience เดิม

```sh
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-office.mjs
pnpm build
# Optional UI checks; requires Python Playwright and /usr/bin/chromium.
# This script creates synthetic records ONLY in the local emulated database.
python3 scripts/smoke-office.py
python3 scripts/smoke-campus.py
```

การติดตั้งและ build ไม่เริ่ม worker อิสระหรือโมเดล ไม่ส่งอีเมล ไม่ใช้ข้อมูล production การทดสอบ provider/email ใช้ mock เท่านั้น รายการ env และ migrations อยู่ใน [ผลส่งมอบ](docs/CODEX_HANDOFF_TH.md)
