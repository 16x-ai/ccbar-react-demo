/**
 * 来电浮层：可能同时有多路来电，所以按列表渲染，每路一组「接听 / 拒接」。
 */
import type { IncomingCall } from "../lib/usePhone";

export function IncomingCallModal({
  calls,
  busy,
  onAnswer,
  onReject,
}: {
  calls: IncomingCall[];
  busy: boolean;
  onAnswer: (callId: string) => void;
  onReject: (callId: string) => void;
}) {
  return (
    <div className="call-modal-overlay">
      <div className="call-modal call-modal-multi">
        <div className="call-modal-title">来电（{calls.length}）</div>
        {calls.map((call) => (
          <div key={call.callid} className="ccbar-incoming-item">
            <div className="caller-name">{call.callerName}</div>
            <div className="button-container">
              <button
                type="button"
                className="call-button answer-button"
                disabled={busy}
                onClick={() => onAnswer(call.callid)}
              >
                接听
              </button>
              <button
                type="button"
                className="call-button cancel-button"
                disabled={busy}
                onClick={() => onReject(call.callid)}
              >
                拒接
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
