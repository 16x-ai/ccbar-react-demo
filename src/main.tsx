import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import App from "./App";

// StrictMode：dev 下会刻意把副作用跑两遍（挂载 → 卸载 → 再挂载）。
// usePhone 的挂载/卸载都是可重复执行的（对未连接的实例 dispose 没有副作用），
// 所以这里保留它 —— 客户项目里通常也开着。表现是 dev 的日志面板会多一行「页面已就绪」。
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
