# Node CI/CD Kata · Solución

Solución de referencia de la práctica de CI/CD con Node.js 24, TypeScript, GitHub Actions, Docker Hub y Render. El servicio ofrece una API pequeña para seguir un cambio desde el commit hasta una URL pública.

## API

- `/` redirige a Swagger UI.
- `/docs` muestra la API.
- `/dice/roll` devuelve un entero entre 1 y 6.
- `/version` devuelve el valor `APP_VERSION` incorporado a la imagen.
- `/health` devuelve `{"status":"ok"}` cuando la aplicación responde.

`/health` comprueba disponibilidad. `/version` identifica el artefacto que responde. El smoke test comprueba el contrato del dado; una señal no sustituye a las otras.

## Requisitos y ejecución local

- Node.js 24 o superior y npm.
- Git para clonar y ejecutar el hook de pre-commit.
- Docker para construir y ejecutar imágenes localmente.
- Cuentas de Docker Hub y Render para el despliegue.

```bash
npm ci
npm run check
npm run build
npm run dev
```

El servidor escucha en `http://localhost:10000`. Para probar la imagen:

```bash
docker build --build-arg APP_VERSION=local -t cicd-kata:local .
docker run --rm -p 10000:10000 cicd-kata:local
curl http://localhost:10000/dice/roll
curl http://localhost:10000/version
curl http://localhost:10000/health
```

En PowerShell el servidor también puede iniciarse en otro puerto con `$env:PORT=3000; npm run dev`.

## Qué hace la solución

### Integración continua

`.github/workflows/code-quality.yml` ejecuta lint, formato, typecheck, tests y build al abrir o actualizar una pull request a `main`. El check requerido en la protección de rama se llama **Quality checks**. El hook Husky ejecuta `npm run check` antes de cada commit local; CI sigue siendo la verificación compartida.

### Publicar y desplegar

`.github/workflows/docker-publish.yml` vuelve a comprobar calidad y build al recibir cambios en `main`; el job de publicación depende de que esos pasos terminen bien. Construye una imagen con el SHA completo como `APP_VERSION`, publica `latest` y `sha-<SHA>`, pide a Render desplegar esa etiqueta concreta y comprueba el servicio.

Tras el hook, Actions espera hasta cinco minutos a que `/version` coincida con el SHA esperado. Después llama a `/health` y verifica que `/dice/roll` responda un entero entre 1 y 6. Si una comprobación falla, el workflow queda en rojo y da detalles en sus logs.

### Incidente de demostración

El workflow de publicación permite una ejecución manual con `simulate_incident`. Úsala únicamente en un servicio de demostración: construye una imagen separada, etiquetada `sha-<SHA>-incident`, que devuelve un valor fuera del rango esperado. No sobrescribe la imagen buena `sha-<SHA>`. La CI de código sigue pasando porque las pruebas de comportamiento se ejecutan con la configuración normal; el smoke test remoto detecta el incidente después del despliegue.

No configures `DEMO_INCIDENT` en las variables de entorno de Render. La opción manual incorpora el valor en la imagen, de modo que al recuperar la imagen buena desaparece también el fallo.

### Rollback

`.github/workflows/rollback.yml` recibe el SHA completo de una imagen buena publicada, construye la etiqueta `sha-<SHA>`, pide a Render que la despliegue y espera a que `/version`, `/health` y el smoke test confirmen la recuperación. No acepta `latest`, tags arbitrarios ni la variante `-incident`.

El rollback solo restablece la imagen. No revierte cambios externos, como una base de datos o configuración modificada directamente en Render.

## Configurar un repositorio de enseñanza

En **Settings → Secrets and variables → Actions**, crea estos secrets:

| Nombre                   | Valor                                 |
| ------------------------ | ------------------------------------- |
| `DOCKERHUB_USERNAME`     | Usuario de Docker Hub                 |
| `DOCKERHUB_REPOSITORY`   | Nombre del repositorio de imagen      |
| `DOCKERHUB_TOKEN`        | Access token con permiso de escritura |
| `RENDER_DEPLOY_HOOK_URL` | Deploy Hook del servicio Render       |

Crea la variable `BASE_URL` con la URL pública del servicio, sin `/` final. En Render, configura un Web Service basado en la imagen Docker Hub `docker.io/<usuario>/<repositorio>`. `/health` puede usarse como health-check path del servicio.

El Deploy Hook es secreto. La imagen del repositorio debe ser pública, o Render debe tener permiso para descargarla. Las etiquetas usan el SHA completo para identificar cada imagen. No reutilices una etiqueta; conserva el SHA bueno antes de hacer una prueba de rollback.

Configura protección de `main` para requerir `Quality checks`. `solved` puede usarse como rama predeterminada de un repositorio de demostración, o puede copiarse como contenido inicial de un fork de enseñanza. GitHub solo ofrece el botón manual de un workflow `workflow_dispatch` cuando ese workflow existe en la rama predeterminada.

## Recorrido sugerido

1. Partir de `main` para que los alumnos añadan `version`, `health`, seguimiento de SHA y smoke test.
2. Construir y probar la imagen localmente; publicarla en Docker Hub y crear el servicio en Render.
3. Completar el flujo de GitHub Actions y observar la URL, el SHA y la etiqueta asociada.
4. Guardar un SHA bueno, lanzar `simulate_incident` en el servicio de demostración y comprobar que falla el smoke test.
5. Ejecutar **Roll back Render image** con el SHA bueno y confirmar las tres comprobaciones de recuperación.

Si se continúa desde una kata anterior que cambia la tirada a `X + i`, hay que adaptar el schema, los tests y el smoke test al contrato elegido. Esta solución completa usa el rango 1–6.

## Resolución de problemas

- Un 404 en `/version` o `/health` suele indicar que Render aún sirve una imagen anterior.
- Si el hook termina bien pero `/version` no cambia, comprueba que la solicitud incluye `imgURL` con `sha-<SHA>`.
- Si `BASE_URL` está vacío o acaba en `/`, el workflow se detiene antes de publicar.
- Si la espera de versión agota el tiempo, consulta el deploy en Render y los logs antes de repetirlo.
- Si el smoke test falla, conserva el tag desplegado y usa el SHA bueno para recuperar.
