# Enhancement Ideas for deBT

## 1. Frequent Contacts (Priority: HIGH)
Tampilkan users yang sering transaksi di dropdown, tanpa perlu ketik @username:
- Auto-populate from transaction history
- Quick access untuk repeat transactions
- Grouped by: "Recent" dan "Frequent"

```typescript
// Suggestion:
static getFrequentContacts(userId: string, limit: number = 5) {
  const userDebts = this.getDebtsByUserId(userId);
  const contactFrequency = new Map<string, number>();
  
  userDebts.forEach(debt => {
    if (debt.otherUserId) {
      contactFrequency.set(
        debt.otherUserId, 
        (contactFrequency.get(debt.otherUserId) || 0) + 1
      );
    }
  });
  
  return Array.from(contactFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([userId]) => this.getUserById(userId))
    .filter(u => u !== undefined);
}
```

## 2. Smart Search (Priority: MEDIUM)
- Search by name, username, atau email
- Fuzzy matching untuk typo tolerance
- Show recent transactions dengan user tersebut

## 3. Blocked Users (Priority: LOW)
Untuk production:
- User bisa block unwanted transaction requests
- Blacklist system

## 4. QR Code untuk Add Contact (Priority: LOW)
- Generate QR code per user
- Scan untuk quick add

---

## ❌ Kenapa TIDAK pakai "Add Friend" system:

1. **Extra friction** - User harus "befriend" dulu sebelum transaksi
2. **Not necessary** - Approval system sudah cukup protect
3. **Overhead** - Butuh UI/screen/table tambahan
4. **Use case mismatch** - Debt tracking ≠ social network

## ✅ Recommended Flow:

```
Current (Good):
User A → Input @username → Create debt → Status: pending 
→ User B approve → Transaction confirmed

Enhanced (Better):
User A → See "Frequent Contacts" dropdown → Quick select
OR → Input @username → Autocomplete suggestions
→ Create debt → Status: pending → User B approve
```

---

**Conclusion:** Stick with @username, enhance dengan frequent contacts dan smart suggestions!
