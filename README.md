# API
- Create file in prod
```sh
# secrets/serviceAccountKey.json
```

- Health
```sh
http://192.168.92.33:3338/health
```


POST:
```sh
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{
    "tokens": ["token1","token2","token3"],
    "notification": { "title": "Hola!", "body": "Mensaje de prueba" },
    "data": { "foo": "bar" }
  }'
```

RESPONSE:
```jsonc
{
  "message": "Procesado",
  "projectId": "yiga5-24enlinea",
  "chunkSize": 100,
  "concurrency": 10,
  "total": 3,
  "sent": 2,
  "failed": 1,
  "failures": [
    { "token": "token3", "status": 404, "error": { "error": { "status": "NOT_FOUND", "message": "Requested entity was not found." } } }
  ]
}
```
