# Node CI/CD Kata

Versión en Node.js y TypeScript de la práctica
[Python CI/CD Kata](https://github.com/aran159/python-cicd-kata). El servicio simula la
tirada de un dado y sirve como base para practicar integración y despliegue continuos con
GitHub Actions, Docker Hub y Render.

## Prerrequisitos

- [Node.js 24 o superior](https://nodejs.org/es/download). La versión recomendada está
  indicada en `.nvmrc`.
- npm, incluido con Node.js.
- Docker, únicamente si se quiere construir y ejecutar la imagen localmente.
- Git, para trabajar con el repositorio y ejecutar el hook de pre-commit de Husky.
- Cuentas de Docker Hub y Render, únicamente para realizar el despliegue.

## Dependencias

Las dependencias se declaran en `package.json`, quedan fijadas en `package-lock.json` y se
instalan con npm:

```bash
npm install
```

Dependencias de ejecución:

- `fastify`: servidor HTTP.
- `@fastify/swagger` y `@fastify/swagger-ui`: documentación OpenAPI y Swagger UI.

Dependencias de desarrollo:

- `typescript`, `tsx` y `@types/node`: desarrollo y compilación en TypeScript.
- `vitest`: ejecución de tests.
- `eslint` y `typescript-eslint`: análisis estático y linting.
- `prettier` y `eslint-config-prettier`: formateo del código.
- `husky`: hook de pre-commit para ejecutar las comprobaciones de calidad.

## Primeros pasos

```bash
npm install
```

## Servidor de desarrollo

Inicia el servidor con recarga automática al modificar los archivos fuente:

```bash
npm run dev
```

Por defecto, el servidor escucha en `http://localhost:10000`. También puedes cambiar el puerto
con la variable de entorno `PORT`:

```bash
PORT=3000 npm run dev
```

En PowerShell:

```powershell
$env:PORT=3000; npm run dev
```

Para detenerlo, pulsa `Ctrl+C`. Con el puerto por defecto, las rutas disponibles son:

- `http://localhost:10000/`: redirige a Swagger UI.
- `http://localhost:10000/docs`: documentación interactiva de la API.
- `http://localhost:10000/dice/roll`: devuelve un entero aleatorio entre 1 y 6.

## Calidad de código

```bash
npm run lint          # ESLint
npm run lint:fix      # ESLint con correcciones automáticas
npm run format        # aplicar Prettier
npm run format:check  # comprobar Prettier sin modificar archivos
npm run typecheck     # comprobar tipos sin compilar
npm test              # ejecutar tests una vez
npm run build         # compilar en dist/
npm run check         # ejecutar todas las comprobaciones
```

Husky instala un hook de pre-commit durante `npm install` cuando la carpeta es la raíz de
su propio repositorio Git. El hook ejecuta `npm run check` antes de aceptar cada commit.

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
