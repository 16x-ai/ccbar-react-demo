/**
 * 设置弹窗。
 *
 * 输入框直接改 page.config（受控输入，onChange 把改动交给 usePhone.updateConfig），
 * 点「保存」时由 usePhone 校验并写盘；校验不通过会在页面上显示红字，弹窗不关。
 */
import type { PhoneConfig } from "../lib/settings";

export function SettingsDialog({
  open,
  config,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean;
  config: PhoneConfig;
  onChange: (patch: Partial<PhoneConfig>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  if (!open) return null;
  return (
    <div
      id="ccbar-settings-mask"
      onClick={(event) => {
        // 相当于 Vue 的 @click.self：只有点遮罩本身才关，点弹窗内部不关
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="ccbar-settings-dialog" role="dialog" aria-labelledby="ccbar-settings-title">
        <h3 id="ccbar-settings-title">设置</h3>

        <label htmlFor="ccbar-setting-host">API 主机</label>
        <input
          id="ccbar-setting-host"
          type="text"
          value={config.host}
          onChange={(event) => onChange({ host: event.target.value })}
          placeholder="https://你们的接口网关"
          autoComplete="off"
        />

        <label htmlFor="ccbar-setting-key">API KEY</label>
        <input
          id="ccbar-setting-key"
          type="text"
          value={config.appKey}
          onChange={(event) => onChange({ appKey: event.target.value })}
          placeholder="请输入 API KEY"
          autoComplete="off"
        />

        <label htmlFor="ccbar-setting-secret">API SECRET</label>
        <input
          id="ccbar-setting-secret"
          type="password"
          value={config.appSecret}
          onChange={(event) => onChange({ appSecret: event.target.value })}
          placeholder="请输入 API SECRET"
          autoComplete="off"
        />

        <label htmlFor="ccbar-setting-extension">内部分机</label>
        <input
          id="ccbar-setting-extension"
          type="text"
          value={config.extension}
          onChange={(event) => onChange({ extension: event.target.value })}
          placeholder="例如 8001，不含企业前缀"
          inputMode="numeric"
          autoComplete="off"
        />

        <label htmlFor="ccbar-setting-sipws">软电话 WSS</label>
        <input
          id="ccbar-setting-sipws"
          type="text"
          value={config.sipWs}
          onChange={(event) => onChange({ sipWs: event.target.value })}
          placeholder="wss://你们的软电话地址/api/fs/sip-ws"
          autoComplete="off"
        />

        <label htmlFor="ccbar-setting-expires">SIP 注册有效期（覆盖项，可留空）</label>
        <input
          id="ccbar-setting-expires"
          type="number"
          min="10"
          max="3600"
          step="1"
          value={config.registerExpires}
          onChange={(event) => onChange({ registerExpires: event.target.value })}
          placeholder="默认 600"
          inputMode="numeric"
        />

        <p className="ccbar-settings-hint">控制多久重新 getAccount 换 SIP 密码。默认 600 秒。</p>

        <div className="ccbar-settings-actions">
          <button type="button" id="ccbar-settings-cancel" onClick={onClose}>
            取消
          </button>
          <button type="button" id="ccbar-settings-save" onClick={onSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
