# Telegram Runner Demo — Flow Audit

Ngày: 2026-08-16

## Flow đã kiểm tra trong bản demo

| Flow | Trạng thái | Ghi chú |
| --- | --- | --- |
| Mở Runner / Project Console | Pass | Có role switcher rõ ràng. |
| Kết nối TON wallet | Pass | Có modal riêng, chỉ là simulated wallet. |
| Quick Run không đăng ký campaign | Pass | Runner vào Run và bắt đầu ngay; wallet không phải điều kiện để chạy. |
| Live GPS / Demo Route | Pass về code | `watchPosition` cho Live GPS, route mô phỏng có nhãn riêng. Cần thử máy thật trong Telegram trước production. |
| Start / Stop session | Pass | Stop lưu activity rồi chuyển vào Activity. |
| Activity history | Pass | Có empty state, summary và activity proof; không hiển thị/lưu route map sau session. |
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

- Browser automation trực tiếp không chạy được trong môi trường hiện tại vì browser client module bị thiếu.
- Live GPS cần kiểm tra thủ công trên Telegram iOS và Android.
- TON Connect, oracle và TON testnet claim hiện là mock có nhãn rõ ràng.
