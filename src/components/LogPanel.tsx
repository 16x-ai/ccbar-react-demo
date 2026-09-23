/**
 * 日志卡片：两个页签（日志 / SIP），点「清空」只清当前页签。
 *
 * 数据全部来自 usePhone：logs 是全部行，按 panel 分流；placeholder 是空面板时的提示语。
 */
import { useEffect, useRef, useState } from "react";
import type { LogLine, LogPanel as Panel } from "../lib/logs";

export function LogPanel({
  logs,
  placeholder,
  clear,
}: {
  logs: LogLine[];
  placeholder: Record<Panel, string>;
  clear: (panel: Panel) => void;
}) {
  const [panel, setPanel] = useState<Panel>("flow");
  const body = useRef<HTMLDivElement>(null);
  const lines = logs.filter((line) => line.panel === panel);

  // 与参考页一致：新日志进来、或切换页签后滚到底
  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length, panel]);

  return (
    <section className="log-card">
      <div className="bar-head">
        <div className="log-tabs" role="tablist" aria-label="日志类型">
          <button
            type="button"
            role="tab"
            aria-selected={panel === "flow"}
            onClick={() => setPanel("flow")}
          >
            日志
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panel === "sip"}
            onClick={() => setPanel("sip")}
          >
            SIP
          </button>
        </div>
        <button type="button" id="ccbar-log-clear" onClick={() => clear(panel)}>
          清空
        </button>
      </div>

      <div ref={body} className="log-body" data-empty={lines.length ? "0" : "1"}>
        {lines.length ? (
          lines.map((line) => (
            <div key={line.id} className={`log-line ${line.level}`}>
              <span className="log-time">{line.time}</span>
              <span className="log-src">[{line.source}]</span>
              <span className="log-msg">{line.message}</span>
            </div>
          ))
        ) : (
          placeholder[panel]
        )}
      </div>
    </section>
  );
}
