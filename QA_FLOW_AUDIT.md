# Telegram Runner Demo — Flow Audit

Ngày: 2026-08-16

## Flow đã kiểm tra trong bản demo

| Flow | Trạng thái | Ghi chú |
| --- | --- | --- |
| Mở Runner / Project Console | Pass | Có role switcher rõ ràng. |
| Kết nối TON wallet | Pass | Có modal riêng, chỉ là simulated wallet. |
| Quick Run không đăng ký campaign | Pass | Runner vào Run và bắt đầu ngay; wallet không phải điều kiện để chạy. |
| Live GPS / Demo Route | Pass về code | Ưu tiên Telegram `LocationManager.init()` + `getLocation()` poll 5 giây/lần; fallback `watchPosition` khi không có Telegram API. Có request quyền, mở Telegram Settings và lọc accuracy/jump. Cần thử máy thật trong Telegram trước production. |
| Start / Stop session | Pass | Stop lưu activity rồi chuyển vào Activity. |
| Activity history | Pass | Có empty state, summary và activity proof; không hiển thị/lưu route map sau session. |
| Nhiều sessions trong campaign window | Pass về code | Mỗi session tạo proof riêng; quãng đường được cộng dồn trong Activity và Rewards. Dữ liệu chỉ tồn tại trong phiên demo hiện tại. |
| Reward checking | Pass | Tách riêng trong Rewards và auto-match activity proof với campaign đang mở; có checking, eligible, more-running và claimed. |
| Claim reward | Pass trong demo | Chỉ cần connect wallet sau eligibility; payout vẫn không phải TON testnet thật. |
| Project KYB/KYC | Pass | Có sandbox approval rõ ràng. |
| Campaign setup / funding / publish | Pass | Có wizard, review và dashboard sau publish. |

## Các màn được bổ sung trong lần này

1. Quick Run: chạy trước, không cần join campaign hay connect wallet.
2. Activity tab chỉ giữ summary và activity proof; raw GPS points bị bỏ sau session.
3. Rewards tab auto-match activity proof với campaign đang mở, tách hoàn toàn khỏi Activity.
4. Claim chỉ yêu cầu wallet khi activity đã eligible: `matching → eligible / more activity needed → claimed`.

## Ranh giới còn lại

- Browser automation trực tiếp chưa chạy được trong môi trường hiện tại: browser client cũ thiếu module và `agent-browser` CLI cũng không có. Build/rendered-HTML không thay thế cho QA trực quan trên Telegram.
- Live GPS cần kiểm tra thủ công trên Telegram iOS và Android: cấp/từ chối quyền, GPS trong nhà/ngoài trời, app bị minimize, và stop session khi request GPS đang pending.
- TON Connect, oracle và TON testnet claim hiện là mock có nhãn rõ ràng.
