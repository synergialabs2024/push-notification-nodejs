# DEPLOY — push-api

Contenedor: `api-push` · Puerto: `3338` · Profile: `api`
Correr desde la raíz del repo (`/home/adrian_synergialabs/code/push`).

## Deploy (cada vez que cambie el código)

```bash
docker compose --profile api up -d --build api-push
```

## Deploy limpio (cambió Dockerfile, package.json o pnpm-lock.yaml)

```bash
docker compose --profile api build --no-cache api-push
docker compose --profile api up -d --force-recreate api-push
```

## Verificar

```bash
docker compose ps
curl -s http://localhost:3338/health
```

## Logs

```bash
docker logs --tail 100 -f api-push
```

## Reiniciar sin reconstruir

```bash
docker compose --profile api restart api-push
```

## Detener

```bash
docker compose --profile api down
```

## Si el build baja pnpm equivocada

```bash
docker builder prune -f
docker compose --profile api build --no-cache api-push
```
