# Node CI/CD Kata

Versión en Node.js y TypeScript de la práctica
[Python CI/CD Kata](https://github.com/aran159/python-cicd-kata). El servicio simula la
tirada de un dado y sirve como base para practicar integración y despliegue continuos con
GitHub Actions, Docker Hub y Render.

## Equivalencias con la kata original

| Python                  | Node.js + TypeScript              |
| ----------------------- | --------------------------------- |
| `uv` y `pyproject.toml` | pnpm y `package.json`             |
| FastAPI + Uvicorn       | Fastify                           |
| Swagger de FastAPI      | OpenAPI + Swagger UI para Fastify |
| Ruff linter             | ESLint                            |
| Ruff formatter          | Prettier                          |
| Pyright                 | TypeScript en modo estricto       |
| pytest                  | Vitest                            |
| pre-commit              | Husky                             |

## Requisitos

- Node.js 24
- [pnpm](https://pnpm.io/installation) mediante Corepack
- Docker para construir y ejecutar la imagen
- Cuentas de Docker Hub y Render para el despliegue

## Primeros pasos

```bash
corepack enable
pnpm install
pnpm dev
```

El servidor escucha en `http://localhost:10000`. Rutas disponibles:

- `http://localhost:10000/`: redirige a Swagger UI.
- `http://localhost:10000/docs`: documentación interactiva de la API.
- `http://localhost:10000/dice/roll`: devuelve un entero aleatorio entre 1 y 6.

En PowerShell, si Corepack necesita permisos de administrador, se puede ejecutar pnpm con
`corepack pnpm <comando>`.

## Calidad de código

```bash
pnpm lint          # ESLint
pnpm lint:fix      # ESLint con correcciones automáticas
pnpm format        # aplicar Prettier
pnpm format:check  # comprobar Prettier sin modificar archivos
pnpm typecheck     # comprobar tipos sin compilar
pnpm test          # ejecutar tests una vez
pnpm build         # compilar en dist/
pnpm check         # ejecutar todas las comprobaciones
```

Husky instala un hook de pre-commit durante `pnpm install` cuando la carpeta es la raíz de
su propio repositorio Git. El hook ejecuta `pnpm check` antes de aceptar cada commit.

## Docker

Construir y ejecutar la imagen:

```bash
docker build -t <usuario>/<servicio>:latest .
docker run --rm -p 10000:10000 <usuario>/<servicio>:latest
```

Comprobar el servicio:

```bash
curl http://localhost:10000/dice/roll
```

## GitHub Actions

El repositorio incluye dos workflows:

- `.github/workflows/code-safety.yml`: en cada pull request a `main`, ejecuta lint,
  formato, tipos, tests y build.
- `.github/workflows/deploy.yml`: al integrar en `main`, publica las etiquetas del commit
  y `latest` en Docker Hub y activa el deploy hook de Render.

Configura en **Settings → Secrets and variables → Actions**:

| Tipo     | Nombre                 | Valor                            |
| -------- | ---------------------- | -------------------------------- |
| Variable | `DOCKERHUB_USERNAME`   | Usuario de Docker Hub            |
| Variable | `DOCKERHUB_REPOSITORY` | Nombre del repositorio de imagen |
| Secret   | `DOCKERHUB_TOKEN`      | Token de acceso de Docker Hub    |
| Secret   | `DEPLOY_WEBHOOK_URL`   | Deploy hook generado por Render  |

En Render, crea un Web Service a partir de una imagen existente y usa inicialmente
`docker.io/<usuario>/<repositorio>:latest`. El workflow enviará después la etiqueta inmutable
del commit mediante el parámetro `imgURL`.

## Flujo sugerido para la práctica

1. Crea un repositorio de GitHub con el contenido de esta carpeta.
2. Trabaja en una rama `feature/dice-plus-<n>` y abre un pull request a `main`.
3. Configura las reglas de protección de `main` para exigir los checks `quality` y `tests`.
4. Configura las variables y secretos anteriores.
5. Integra el pull request; el workflow de despliegue publicará y desplegará la imagen.
6. Entrega la URL de GitHub Actions y la URL de Swagger UI (`/docs`).

## Desarrollo del ejercicio

La función de dominio está aislada en `src/application/get-dice-roll.ts`, por lo que se puede
ampliar sin acoplarla a HTTP. Una continuación natural de la kata consiste en aceptar el
número de caras o el número de dados, añadir los tests primero y completar el cambio mediante
un pull request.
