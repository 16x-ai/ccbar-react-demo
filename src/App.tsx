/**
 * 页面骨架：上半部分是坐席条，下半部分是日志卡片，中间夹设置弹窗与来电浮层。
 *
 * 这里只做两件事：
 *   1. 把 usePhone 的状态绑到标签上（状态文案与配色见 lib/logs.ts）；
 *   2. 把按钮点击交给 usePhone 的动作（按钮 → SDK 调用的对照表见 docs/前端接入文档.md）。
 * 真正的逻辑都在 src/lib 里，页面本身尽量薄。
 */
import { useState } from "react";
import { IncomingCallModal } from "./components/IncomingCallModal";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { LogPanel } from "./components/LogPanel";
import { SettingsDialog } from "./components/SettingsDialog";
import { usePhone } from "./lib/usePhone";

export default function App() {
  const phone = usePhone();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 三个状态标签：坐席 / 通话 / SIP，各自取自 SDK 的状态
  const agentLabel = phone.agentText[phone.agent];
  const callLabel = phone.callStatusText[phone.callState];
  const connectionLabel = phone.connectionText[phone.connection];

  // 有未结束的通话（含还没接听的来电）——决定「通话」那一行按钮是否可用
  const hasCall = !["idle", "ended", "failed"].includes(phone.callState);

  // 保存设置失败时，错误会显示在坐席条下方的红字行里，弹窗保持打开
  function saveSettings() {
    try {
      phone.saveSettings();
      setSettingsOpen(false);
      phone.clearError();
    } catch (error) {
      phone.showError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div className="page">
      <div className="____ccbar____">
        <div className="bar-head">
          <div>
            <strong>CC Bar</strong>
            <span> · React 嵌入示例</span>
          </div>
          <div className="bar-head-right">
            {phone.extension ? (
              <span
                id="ccbar-extension"
                className="ext-chip"
                title={phone.customerPrefix ? `前缀 ${phone.customerPrefix}` : undefined}
              >
                {phone.customerPrefix ? (
                  <>
                    前缀 <b className="ext-prefix">{phone.customerPrefix}</b>
                  </>
                ) : null}
                {phone.customerPrefix ? <span className="ext-sep">·</span> : null}
                分机 <b>{phone.extension}</b>
              </span>
            ) : null}
            <button
              type="button"
              id="ccbar-settings-btn"
              aria-label="设置"
              onClick={() => setSettingsOpen(true)}
            >
              设置
            </button>
          </div>
        </div>

        <div className="bar-row">
          <div className="k">状态</div>
          <div className="chips">
            <span className={`ccbar_status ccbar_work_status_${agentLabel.tone}`}>
              {agentLabel.text}
            </span>
            <span className={`ccbar_status ccbar_serv_status_${callLabel.tone}`}>
              {callLabel.text}
            </span>
            <span className={`ccbar_status ccbar_sip_status_${connectionLabel.tone}`}>
              {connectionLabel.text}
            </span>
          </div>
        </div>

        <div className="bar-row">
          <div className="k">号码</div>
          <input
            id="____ccbar_numb_input____"
            className="ccbar_number_input"
            value={phone.number}
            onChange={(event) => phone.setNumber(event.target.value)}
            placeholder="输入号码后外呼或转接"
            autoComplete="off"
          />
        </div>

        <div className="bar-row">
          <div className="k">签入</div>
          <div className="btns">
            <button
              type="button"
              id="____ccbar_signin____"
              className="ccbar_items btn-primary"
              disabled={!!phone.busy || phone.connected}
              onClick={() => phone.run("签入", phone.signIn)}
            >
              签入
            </button>
            <button
              type="button"
              id="____ccbar_signou____"
              className="ccbar_items"
              disabled={!!phone.busy || !phone.connected}
              onClick={() => phone.run("退签", phone.signOut)}
            >
              退签
            </button>
          </div>
        </div>

        <div className="bar-row">
          <div className="k">通话</div>
          <div className="btns">
            {/* 外呼 / 内呼用「号码」框里的号码 */}
            <button
              type="button"
              className="ccbar_items"
              disabled={!!phone.busy || !phone.connected || !phone.number.trim()}
              onClick={() => phone.run("外呼", () => phone.dial(phone.number))}
            >
              外呼
            </button>
            <button
              type="button"
              id="____ccbar_inside____"
              className="ccbar_items"
              disabled={!!phone.busy || !phone.connected || !phone.number.trim()}
              onClick={() => phone.run("内呼", () => phone.dial(phone.number, true))}
            >
              内呼
            </button>
            <button
              type="button"
              id="____ccbar_hangup____"
              className="ccbar_items btn-danger"
              disabled={!!phone.busy || !hasCall}
              onClick={() => phone.run("挂断", phone.hangup)}
            >
              挂断
            </button>
            <button
              type="button"
              id="____ccbar_transo____"
              className="ccbar_items"
              disabled={!!phone.busy || !hasCall || !phone.number.trim()}
              onClick={() => phone.run("转接", () => phone.transfer(phone.number))}
            >
              转接
            </button>
            <button
              type="button"
              id="____ccbar_cahold____"
              className="ccbar_items"
              disabled={!!phone.busy || phone.callState !== "active"}
              onClick={() => phone.run("保持", phone.hold)}
            >
              保持
            </button>
            <button
              type="button"
              id="____ccbar_unhold____"
              className="ccbar_items"
              disabled={!!phone.busy || phone.callState !== "held"}
              onClick={() => phone.run("恢复", phone.resume)}
            >
              恢复
            </button>
          </div>
        </div>

        <div className="bar-row">
          <div className="k">坐席</div>
          <div className="btns">
            <button
              type="button"
              id="____ccbar_set_id____"
              className="ccbar_items"
              disabled={!!phone.busy || !phone.connected}
              onClick={() => phone.run("空闲", () => phone.setAgent("available"))}
            >
              空闲
            </button>
            <button
              type="button"
              id="____ccbar_set_bu____"
              className="ccbar_items"
              disabled={!!phone.busy || !phone.connected}
              onClick={() => phone.run("置忙", phone.setBusy)}
            >
              置忙
            </button>
            <button
              type="button"
              id="____ccbar_set_re____"
              className="ccbar_items"
              disabled={!!phone.busy || !phone.connected}
              onClick={() => phone.run("休息", () => phone.setAgent("break"))}
            >
              休息
            </button>
          </div>
        </div>

        <div id="____ccbar_errori____">{phone.feedback}</div>
      </div>

      <LogPanel logs={phone.logs} placeholder={phone.placeholder} clear={phone.clearLog} />

      <SettingsDialog
        open={settingsOpen}
        config={phone.config}
        onChange={phone.updateConfig}
        onClose={() => setSettingsOpen(false)}
        onSave={saveSettings}
      />

      {phone.loading ? <LoadingOverlay text={phone.loading} /> : null}

      {phone.incoming.length ? (
        <IncomingCallModal
          calls={phone.incoming}
          busy={!!phone.busy}
          onAnswer={(callId) => phone.run("接听", () => phone.answerCall(callId))}
          onReject={(callId) => phone.run("拒接", () => phone.rejectCall(callId))}
        />
      ) : null}
    </div>
  );
}
