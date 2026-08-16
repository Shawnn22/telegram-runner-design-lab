# Telegram Runner Demo — Flow Audit

Ngày: 2026-08-16

## Flow đã kiểm tra trong bản demo

| Flow | Trạng thái | Ghi chú |
| --- | --- | --- |
| Mở Runner / Project Console | Pass | Có role switcher rõ ràng. |
| Kết nối TON wallet | Pass | Có modal riêng, chỉ là simulated wallet. |
| Join campaign | Pass | Chuyển sang màn chọn nguồn activity. |
| Live GPS / Demo Route | Pass về code | `watchPosition` cho Live GPS, route mô phỏng có nhãn riêng. Cần thử máy thật trong Telegram trước production. |
| Start / Stop session | Pass | Stop lưu activity rồi chuyển vào Activity. |
| Activity history | Pass | Có empty state và saved activity card. |
| Reward checking | Pass | Tách riêng trong Rewards, có checking, eligible, more-running và claimed. |
| Claim reward | Pass trong demo | Chỉ mở sau eligibility check mô phỏng; payout vẫn không phải TON testnet thật. |
| Project KYB/KYC | Pass | Có sandbox approval rõ ràng. |
| Campaign setup / funding / publish | Pass | Có wizard, review và dashboard sau publish. |

## Các màn được bổ sung trong lần này

1. Wallet connection sheet.
2. Activity tab có empty state và activity saved detail.
3. Rewards tab có empty state và reward checking tách khỏi activity.
4. Eligibility flow: `checking → eligible / more activity needed → claimed`.

## Ranh giới còn lại

- Browser automation trực tiếp không chạy được trong môi trường hiện tại vì browser client module bị thiếu.
- Live GPS cần kiểm tra thủ công trên Telegram iOS và Android.
- TON Connect, oracle và TON testnet claim hiện là mock có nhãn rõ ràng.
