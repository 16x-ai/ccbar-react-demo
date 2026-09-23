/**
 * 组件冒烟：把每个组件渲染一遍，看初始渲染是否正常。
 * 对应 Vue 版的 tests/compile-vue.test.ts（那边用 @vue/compiler-sfc 编译每个 SFC）。
 *
 * 为什么要绕 Vite 一圈：node --test 走的是 Node 自带的类型擦除，它不支持 JSX，
 * 所以测试里不能直接 import .tsx。这里用 Vite 自己的 ssrLoadModule 借同一套构建管线
 * （含 @vitejs/plugin-react）把 .tsx 编译出来，不额外引入依赖。
 */
import { after, test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import type { ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

// 本机若有 D:\code\ccbar-web-sdk 源码，vite.config.ts 会 alias 过去；测试里固定用 npm 包，
// 保证「客户机器上没有 SDK 源码」那条路径也有覆盖、结果与机器无关
process.env.CCBAR_LOCAL_SDK = "0";

const server = await createServer({
  root: fileURLToPath(new URL("..", import.meta.url)),
  configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "silent",
});

after(async () => {
  await server.close();
});

/** 测试里只用渲染，不需要精确的 props 类型 */
type AnyComponent = ComponentType<Record<string, unknown>>;

/** 编译并取回一个 .tsx 模块的导出 */
async function load<T>(path: string): Promise<T> {
  return (await server.ssrLoadModule(path)) as T;
}

/**
 * 一段文本由「静态 + 插值」拼出来时（例如 `来电（{n}）`），renderToString 会在两段之间插
 * `<!-- -->` 注释节点，断言文案前先去掉它们。
 */
function text(html: string): string {
  return html.replace(/<!-- -->/g, "");
}

test("App 初始渲染：坐席条骨架、三行按钮与日志卡片齐全", async () => {
  const { default: App } = await load<{ default: ComponentType }>("/src/App.tsx");
  const html = renderToString(createElement(App));

  // 按钮与号码框：id 沿用参考页，样式表（app.css）与文档都按这些选
  for (const id of [
    "____ccbar_signin____",
    "____ccbar_signou____",
    "____ccbar_numb_input____",
    "____ccbar_inside____",
    "____ccbar_hangup____",
    "____ccbar_transo____",
    "____ccbar_cahold____",
    "____ccbar_unhold____",
    "____ccbar_set_id____",
    "____ccbar_set_bu____",
    "____ccbar_set_re____",
    "____ccbar_errori____",
    "ccbar-settings-btn",
  ]) {
    assert.ok(html.includes(`id="${id}"`), `缺少 ${id}`);
  }

  // 文案：三个状态标签（未连接时是 离线 / 空闲 / 未注册）与空日志面板的占位
  for (const text of [
    "CC Bar",
    "React 嵌入示例",
    "签入",
    "外呼",
    "内呼",
    "转接",
    "保持",
    "恢复",
    "空闲",
    "置忙",
    "休息",
    "未注册",
    "离线",
    "等待签入",
  ]) {
    assert.ok(html.includes(text), `缺少文案 ${text}`);
  }

  // 还没签入：不显示分机 chip，也不显示全屏遮罩与来电浮层
  assert.ok(!html.includes('id="ccbar-extension"'), "签入前不该有分机 chip");
  assert.ok(!html.includes("ccbar-loading-overlay"), "初始不该有加载遮罩");
  assert.ok(!html.includes("call-modal-overlay"), "初始不该有来电浮层");

  // 按钮的禁用条件：未连接时「签入」可用、「退签」与「外呼」不可用
  assert.ok(!/id="____ccbar_signin____"[^>]*disabled/.test(html), "未连接时签入应可用");
  assert.match(html, /id="____ccbar_signou____"[^>]*disabled/, "未连接时退签应禁用");
  assert.match(html, /class="ccbar_items"[^>]*disabled/, "未连接时外呼应禁用");
});

test("LogPanel：两个页签，日志按面板分流，SIP 行不在「日志」页签里", async () => {
  const { LogPanel } = await load<{ LogPanel: AnyComponent }>("/src/components/LogPanel.tsx");
  const html = renderToString(
    createElement(LogPanel, {
      logs: [
        {
          id: 1,
          panel: "flow",
          level: "info",
          source: "app",
          message: "页面已就绪，等待签入",
          time: "10:00:00.000",
        },
        {
          id: 2,
          panel: "sip",
          level: "warn",
          source: "jssip",
          message: "REGISTER sip:example.test",
          time: "10:00:01.000",
        },
      ],
      placeholder: { flow: "等待签入。", sip: "等待话机登录。" },
      clear: () => undefined,
    }),
  );

  assert.ok(html.includes(">日志</button>") && html.includes(">SIP</button>"), "两个页签");
  assert.ok(html.includes("页面已就绪，等待签入"), "流程日志应显示");
  assert.ok(!html.includes("REGISTER sip:example.test"), "SIP 行不该出现在「日志」页签");
  assert.ok(html.includes('aria-selected="true"'), "有选中的页签");
  assert.ok(html.includes('id="ccbar-log-clear"'), "清空按钮");
});

test("LogPanel：空面板显示占位文案", async () => {
  const { LogPanel } = await load<{ LogPanel: AnyComponent }>("/src/components/LogPanel.tsx");
  const html = renderToString(
    createElement(LogPanel, {
      logs: [],
      placeholder: {
        flow: "等待签入。签入、取 Token、坐席账号会写在这里。",
        sip: "等待话机登录。连接与通话事件会写在这里。",
      },
      clear: () => undefined,
    }),
  );
  assert.ok(html.includes("等待签入。签入、取 Token、坐席账号会写在这里。"));
});

test("SettingsDialog：关闭时不渲染，打开时六个输入框齐全", async () => {
  const { SettingsDialog } = await load<{ SettingsDialog: AnyComponent }>(
    "/src/components/SettingsDialog.tsx",
  );
  const config = {
    host: "https://api.example.test",
    appKey: "demo-key",
    appSecret: "demo-secret",
    extension: "8001",
    sipWs: "wss://sip.example.test/api/fs/sip-ws",
    registerExpires: 600,
  };
  const props = {
    config,
    onChange: () => undefined,
    onClose: () => undefined,
    onSave: () => undefined,
  };

  assert.equal(renderToString(createElement(SettingsDialog, { ...props, open: false })), "");

  const html = renderToString(createElement(SettingsDialog, { ...props, open: true }));
  for (const id of [
    "ccbar-setting-host",
    "ccbar-setting-key",
    "ccbar-setting-secret",
    "ccbar-setting-extension",
    "ccbar-setting-sipws",
    "ccbar-setting-expires",
  ]) {
    assert.ok(html.includes(`id="${id}"`), `缺少 ${id}`);
  }
  assert.ok(html.includes('value="https://api.example.test"'), "输入框应带出当前设置");
  assert.ok(html.includes('value="8001"'));
  assert.ok(html.includes("保存") && html.includes("取消"));
});

test("IncomingCallModal：多路来电按列表渲染", async () => {
  const { IncomingCallModal } = await load<{ IncomingCallModal: AnyComponent }>(
    "/src/components/IncomingCallModal.tsx",
  );
  const html = renderToString(
    createElement(IncomingCallModal, {
      calls: [
        { callid: "c1", callerName: "10086" },
        { callid: "c2", callerName: "未知号码" },
      ],
      busy: false,
      onAnswer: () => undefined,
      onReject: () => undefined,
    }),
  );
  assert.ok(text(html).includes("来电（2）"), "标题应带路数");
  assert.ok(html.includes("10086") && html.includes("未知号码"));
  assert.ok(html.includes("接听") && html.includes("拒接"));
});

test("LoadingOverlay：显示传入的文案", async () => {
  const { LoadingOverlay } = await load<{ LoadingOverlay: AnyComponent }>(
    "/src/components/LoadingOverlay.tsx",
  );
  const html = renderToString(createElement(LoadingOverlay, { text: "正在签入…" }));
  assert.ok(html.includes("ccbar-loading-overlay"));
  assert.ok(html.includes("正在签入…"));
});
