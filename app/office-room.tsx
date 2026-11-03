"use client";
import { useEffect, useRef, useState } from "react";
import {
  Pause,
  Play,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
} from "lucide-react";
import { departments, type Dept, type CompanyState } from "@/lib/company";
import { officeCharacter } from "@/lib/office";
import { officeClock } from "@/lib/office-time";
import type { OfficeZone } from "@/lib/office-campus-nav";
import type { SceneSettings } from "./office-scene-3d";
import type { createOfficeScene } from "./office-scene-3d";
export type OfficeRoomProps = {
  selected: Dept;
  focusKey?:number;
  onSelect: (d: Dept) => void;
  labels: Record<Dept, string>;
  onDocuments: () => void;
  documentCount: number;
  data: CompanyState;
  active: Partial<Record<Dept, boolean>>;
  taskLabels: Record<Dept, string>;
};
export function OfficeRoom(props: OfficeRoomProps) {
  const host = useRef<HTMLDivElement>(null),
    latest = useRef(props),
    scene = useRef<ReturnType<typeof createOfficeScene> | null>(null);
  latest.current = props;
  const [paused, setPaused] = useState(false),
    [reduced, setReduced] = useState(false),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [period, setPeriod] = useState("เวลาไทย");
  const [zone,setZone]=useState<OfficeZone>("overview"),[quality,setQuality]=useState<SceneSettings["quality"]>("medium"),[manualReduced,setManualReduced]=useState(false);
  const settingsRef=useRef<SceneSettings>({zone,quality,reduced});settingsRef.current={zone,quality,reduced:reduced||manualReduced};
  const pausedRef = useRef(false);
  pausedRef.current = paused || reduced || manualReduced;
  useEffect(()=>{if(ready)scene.current?.focus(props.selected);},[props.selected,props.focusKey]);
  useEffect(() => {
    let disposed = false;
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    const clock = () => setPeriod(officeClock().period);
    clock();
    const timer = setInterval(clock, 1000);
    import("./office-scene-3d")
      .then(({ createOfficeScene }) => {
        if (disposed || !host.current) return;
        try {
          scene.current = createOfficeScene(
            host.current,
            () => latest.current,
            () => pausedRef.current,
            ()=>settingsRef.current,
            setZone,
          );
          setReady(true);
        } catch {
          setError(
            "อุปกรณ์นี้เปิด WebGL 3D ไม่สำเร็จ ลองเปิดการเร่งกราฟิกหรือใช้เบราว์เซอร์อื่น แชทและข้อมูลยังใช้งานได้จากปุ่มเลือกฝ่ายด้านล่าง",
          );
        }
      })
      .catch(() => setError("โหลดฉาก 3D ไม่สำเร็จ กรุณาโหลดหน้านี้อีกครั้ง"));
    return () => {
      disposed = true;
      clearInterval(timer);
      query.removeEventListener("change", update);
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);
  return (
    <div className="office-3d">
      <div className="office-3d-toolbar">
        <div>
          <b>CAMPUS / 110</b>
          <small>{period} · Asia/Bangkok · 05:00–24:00</small>
        </div>
        <button
          aria-label={paused ? "เล่นภาพเคลื่อนไหว" : "หยุดภาพเคลื่อนไหว"}
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={17} /> : <Pause size={17} />}
        </button>
        <button aria-label="ซูมเข้า" onClick={() => scene.current?.zoom(0.8)}>
          <ZoomIn size={17} />
        </button>
        <button aria-label="ซูมออก" onClick={() => scene.current?.zoom(1.25)}>
          <ZoomOut size={17} />
        </button>
        <button aria-label="คืนมุมกล้อง" onClick={() => scene.current?.reset()}>
          <RotateCcw size={17} />
        </button>
      </div>
      <div className="campus-zone-controls" aria-label="เลือกโซน">{([["overview","ภาพรวม"],["floor1","ชั้น 1"],["floor2","ชั้น 2"],["garden","สวน"]] as const).map(([id,label])=><button key={id} aria-pressed={zone===id} onClick={()=>setZone(id)}>{label}</button>)}<label>คุณภาพ<select aria-label="คุณภาพภาพ" value={quality} onChange={e=>setQuality(e.target.value as SceneSettings["quality"])}><option value="low">ประหยัด</option><option value="medium">สมดุล</option><option value="high">สูง</option></select></label><label><input type="checkbox" checked={manualReduced||reduced} disabled={reduced} onChange={e=>setManualReduced(e.target.checked)}/>ลดการเคลื่อนไหว</label></div>
      <div
        className="office-3d-stage"
        ref={host}
        data-ready={ready}
        aria-label="ฉากออฟฟิศ 3D แบบเรียลไทม์"
      >
        <div className="office-3d-labels">
          {departments.map((d) => (
            <button
              key={d.id}
              data-agent={d.id}
              className="office-3d-label"
              aria-pressed={props.selected === d.id}
              onClick={() => props.onSelect(d.id)}
            >
              <strong>{officeCharacter(d.id).name}</strong>
              <span>
                {d.short} · {props.labels[d.id]}
              </span>
              <small>{props.taskLabels[d.id]}</small>
            </button>
          ))}
          <button className="office-3d-label campus-doc-label" data-documents onClick={props.onDocuments}>เอกสารรอตรวจ · {props.documentCount}</button>
          <div className="office-3d-boos" data-boos>
            BOSS <small>เจ้าของ</small>
          </div>
        </div>
        {!ready && !error && (
          <p className="office-3d-message" role="status">
            กำลังเปิดออฟฟิศ 3D…
          </p>
        )}
        {error && (
          <p className="office-3d-message" role="alert">
            {error}
          </p>
        )}
        <div className="office-3d-guide">
          ลากเพื่อหมุน · ลากขวาเพื่อเลื่อน · เลื่อนล้อเพื่อซูม
          <br />
          มือถือ: นิ้วเดียวหมุน · สองนิ้วซูมและเลื่อน
        </div>
      </div>
      <div className="comic-footer">
        <button className="btn" onClick={props.onDocuments}>
          <FileText size={18} />
          เอกสารรอตรวจ · {props.documentCount}
        </button>
        <small>
          ท่าทางเป็นภาพประกอบ · สถานะงานจาก backend
          {reduced ? " · ลดการเคลื่อนไหว" : ""}
        </small>
      </div>
    </div>
  );
}
