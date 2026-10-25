# MongoDB backup / restore (dashboard data only)

```bash
mongodump --uri="mongodb://127.0.0.1:27017/paysecure_dr" --out=./backup/$(date +%F)
mongorestore --uri="mongodb://127.0.0.1:27017" --drop ./backup/<date>
```

This protects the dashboard's own metadata and audit history. It is NOT the payment ledger (Aurora).
