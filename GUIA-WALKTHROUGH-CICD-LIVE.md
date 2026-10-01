# Guía de facilitación: completar la kata CI/CD en directo

Runbook para conducir la práctica con el grupo. Está pensado para 150 minutos, equipos de 2–4 personas y el repositorio `node-cicd-kata`. La rama `main` es el punto de partida del alumnado e incluye CI ya configurada; `solved` es la referencia final del instructor. El alumnado comprobará CI con un cambio pequeño, pero no tendrá que diseñar ni implementar ese workflow. El trabajo de la kata se centra en el contenedor, CD, señales operativas y recuperación. Cada bloque termina en una evidencia verificable: no avancéis por el mero hecho de que un comando haya acabado.

La meta de cada equipo es publicar un cambio de su servicio Node.js, demostrar qué SHA está respondiendo en Render y recuperar una imagen conocida como buena tras provocar un fallo controlado.

## Preparación del instructor

### El día anterior

- [ ] Confirma que cada alumno puede acceder al repositorio y que los equipos tienen un fork propio. No compartáis credenciales entre equipos.
- [ ] Decide si cada equipo desplegará en su propio Docker Hub y Render o si el despliegue será una demo del instructor. Para una primera sesión, recomiendo que los alumnos completen local + CI y que el instructor haga una sola publicación/despliegue; después pueden repetirlo por equipos.
- [ ] Comprueba Node.js 24+, npm, Git y Docker Desktop. Docker debe estar iniciado y poder ejecutar `docker info`.
- [ ] Comprueba acceso a GitHub Actions, Docker Hub y Render desde la red del aula. Ten una red alternativa preparada si el firewall bloquea alguno.
- [ ] En un repositorio de enseñanza, prepara los Actions secrets `DOCKERHUB_USERNAME`, `DOCKERHUB_REPOSITORY`, `DOCKERHUB_TOKEN` y `RENDER_DEPLOY_HOOK_URL`, y la variable `BASE_URL` sin barra final. No proyectes ni pegues el Deploy Hook en el chat.
- [ ] En Render, crea el Web Service de tipo **Existing Image** con `docker.io/<usuario>/<repositorio>`, puerto `10000`, variable `PORT=10000` y health-check path `/health`. La imagen debe ser pública o Render debe tener permiso para descargarla.
- [ ] Comprueba `/health`, `/version` y `/dice/roll` desde fuera de Render. En el servicio de demostración del instructor, la URL actual es `https://node-cicd-kata-image.onrender.com`; el plan gratuito puede tardar en despertar.
- [ ] Decide cómo ejecutar los workflows manuales: GitHub muestra `workflow_dispatch` desde la rama predeterminada. En repos de aula, usa `solved` como default solo para la demo ya resuelta, o copia los workflows terminados al default branch del fork. No cambies el default branch del repositorio compartido sin acordarlo.
- [ ] Guarda un SHA bueno publicado antes de la sesión. Ese SHA es el destino de rollback.
- [ ] Abre de antemano Docker Hub, Actions y Render; cierra pestañas con secretos. Ten `solved` a mano como rescate si el grupo se queda bloqueado.

### Configuración detallada de Render

Hazla antes del taller para el servicio de demostración. Si cada equipo va a tener servicio propio, pueden seguir estos mismos pasos cuando ya tengan una imagen publicada en Docker Hub.

1. En Render, pulsa **+ New → Web Service** y, como fuente, elige **Existing Image**.
2. Introduce la imagen de Docker Hub, por ejemplo `docker.io/<usuario>/<repositorio>:<tag>`, y pulsa **Connect**. Para una imagen privada, configura las credenciales del registry; para el taller es más sencillo usar un repositorio público.
3. Completa **Name**, **Region** y el plan de cómputo. Un servicio gratuito puede suspenderse cuando no recibe tráfico y tardar en responder al primer acceso.
4. Abre **Advanced**. Añade la variable `PORT` con valor `10000`. Si esta imagen ya implementa `/health`, configura **Health Check Path** como `/health`. Si estás creando el servicio desde la imagen inicial de `main` y esa ruta todavía no existe, deja el health check vacío por ahora; añádelo después de implementar el endpoint.
5. Pulsa **Create Web Service** y espera a que el primer deploy termine correctamente. En la página del servicio, copia la URL `https://<nombre>.onrender.com` y verifica al menos una ruta disponible de la imagen.
6. Cuando `/health` exista, ve a **Settings → Health Checks**, establece `/health` y guarda. Espera a que Render complete el deploy y confirme que la instancia está healthy.
7. Para automatizar despliegues desde Actions, ve a **Settings → Deploy Hook** y crea/copia el hook. Trátalo como una contraseña: no lo pongas en el código ni lo proyectes. En GitHub, abre **Settings → Secrets and variables → Actions → New repository secret** y guárdalo como `RENDER_DEPLOY_HOOK_URL`.
8. En los **Actions secrets**, añade también `DOCKERHUB_USERNAME`, `DOCKERHUB_REPOSITORY` y `DOCKERHUB_TOKEN`; en **Variables**, añade `BASE_URL` con la URL pública sin `/` al final. El tag incluido en el `imgURL` del hook puede cambiar, pero registry/usuario/repositorio deben coincidir con la imagen configurada en el servicio.
9. Para validar el hook sin exponerlo, usa **Manual Deploy** en Render para la primera imagen. Los despliegues posteriores los inicia el workflow. No uses **Deploy latest reference** para probar la automatización por SHA: el workflow solicita expresamente `sha-<SHA>`.

**Check antes de seguir:** el servicio tiene un deploy exitoso y una URL pública; si el endpoint ya está implementado, `/health` devuelve 200. Los nombres de menú pueden variar ligeramente; Render documenta el alta de imágenes existentes, health checks y deploy hooks en [Web Services](https://render.com/docs/web-services), [Health Checks](https://render.com/docs/health-checks) y [Deploy Hooks](https://render.com/docs/deploy-hooks).

### Comprobación técnica del instructor (10 min antes)

En la raíz del repositorio:

```powershell
node --version
npm --version
git --version
docker info
```

En la rama de solución, ejecuta `npm ci`, `npm run check` y `npm run build`. Después verifica la URL pública:

```powershell
curl.exe -i https://node-cicd-kata-image.onrender.com/health
curl.exe -i https://node-cicd-kata-image.onrender.com/version
curl.exe -i https://node-cicd-kata-image.onrender.com/dice/roll
```

Esperado: HTTP 200; `health` devuelve `{"status":"ok"}`; `version` contiene el SHA desplegado; `dice/roll` devuelve un entero entre 1 y 6. Si falla, usa el apartado «Si algo falla» antes de iniciar el bloque.

## Reglas de facilitación

1. Muestra primero el resultado observable y luego pregunta qué tendría que ocurrir para conseguirlo.
2. Da 3–5 minutos para que los equipos lo intenten antes de enseñar el siguiente paso.
3. Después de cada paso, pide una prueba concreta (salida, check verde o endpoint), no un «ya está».
4. Mantén el contrato del dado en 1–6 durante esta kata. El workflow de incidente es la forma deliberada de provocar el fallo sin dejar una regresión escondida en el código.
5. Nunca pidas que alguien comparta tokens, deploy hooks o valores secretos en pantalla.

## Recorrido en directo (150 min)

### 0–10 min · Presentar el reto

**Di:** «Hoy el objetivo no es solo que el código funcione en local. Seguiremos una versión desde el commit hasta Render, comprobaremos qué está respondiendo y practicaremos volver a una versión buena».

Muestra `/docs` y `/dice/roll` en el servicio del instructor. Pregunta: «Si mañana esto falla, ¿qué evidencia nos diría qué versión está desplegada y cómo volveríamos atrás?» Anota las respuestas: tests, health, versión, artefacto y rollback.

**Check de salida:** todos conocen el objetivo y tienen equipo/repositorio asignado.

### 10–20 min · Clonar y conocer el punto de partida

Desde el fork del alumno:

```powershell
git clone <URL-DEL-FORK>
cd node-cicd-kata
git switch main
git status --short --branch
```

**Comprueba:** están en `main`, el árbol está limpio y cada equipo trabaja en su fork. Si el repo ya está clonado, revisa `git remote -v` para evitar que publiquen por error en el repositorio fuente.

**Pregunta:** «¿Qué hace ya el servicio? ¿Qué falta para poder demostrar qué imagen responde?» Distinguid API funcional, CI y despliegue.

### 20–35 min · Ejecutar la aplicación y pasar CI en local

```powershell
npm ci
npm run check
npm run build
npm run dev
```

Deja `npm run dev` ejecutándose y abre otra terminal:

```powershell
curl.exe -i http://localhost:10000/docs
curl.exe -i http://localhost:10000/dice/roll
```

**Check:** `/docs` responde y el dado es un entero entre 1 y 6. `npm run check` cubre lint, formato, TypeScript y tests; `npm run build` comprueba la salida de producción.

**Pausa de enseñanza:** «El check local es rápido, pero no protege la rama compartida. Vamos a hacer que GitHub repita estas garantías en cada cambio».

### 35–50 min · Comprobar la CI que ya viene en `main`

La CI está entregada en `.github/workflows/code-quality.yml`; aquí no se construye desde cero. El objetivo es que el grupo vea qué garantía ofrece y confirme que está activa. En cada fork, crear una rama para un cambio pequeño e inocuo (por ejemplo, documentación):

```powershell
git switch -c feat/primer-cambio
```

Pide que ejecuten `npm run check` antes de subirlo. Luego:

```powershell
git add .
git commit -m "docs: describe first change"
git push -u origin feat/primer-cambio
```

Abren una Pull Request hacia `main`. En **Actions / Checks**, esperan **Quality checks**.

**Check:** la PR tiene el check **Quality checks** en verde. Señala que ya ejecuta lint, formato, TypeScript, tests y build. Si el commit local se bloquea por Husky, deben corregir el fallo y volver a ejecutar los checks; no desactiven el hook para ocultarlo. Si el workflow no aparece, comprueba que `.github/workflows/code-quality.yml` está en `main` y que la PR apunta a `main`.

**Facilitador:** explica brevemente qué verifica la CI ya preparada. No gastes tiempo añadiendo jobs ni modificando el workflow: un check verde valida el código, pero todavía no significa que una imagen esté publicada ni que Render la sirva.

### 50–65 min · Construir y probar la imagen Docker

Vuelve al código de la PR o a la rama que se va a desplegar. En la raíz del proyecto:

```powershell
docker build --build-arg APP_VERSION=local -t cicd-kata:local .
docker run --rm -d --name cicd-kata-local -p 10000:10000 cicd-kata:local
curl.exe -i http://localhost:10000/dice/roll
docker logs cicd-kata-local
docker stop cicd-kata-local
```

En la rama inicial puede que `/version` y `/health` aún no existan: eso es parte de la kata. Primero confirma que el contenedor sirve la funcionalidad existente. Cuando el equipo implemente esos endpoints más adelante, repite también:

```powershell
curl.exe -i http://localhost:10000/version
curl.exe -i http://localhost:10000/health
```

**Check:** build termina sin error, el contenedor arranca y una petición HTTP responde. Si un puerto ya está ocupado, para el proceso anterior o cambia el puerto publicado (`-p 10001:10000`) y consulta `http://localhost:10001`.

**Di:** «La imagen es el artefacto que queremos promover. A partir de aquí interesa identificarla por contenido/commit, no depender de un nombre móvil como `latest`».

### 65–75 min · Publicar manualmente (demo o equipos con cuentas listas)

Solo equipos con repositorio Docker Hub configurado. Sustituye `<usuario>` por el nombre propio:

```powershell
docker login
docker tag cicd-kata:local <usuario>/cicd-kata:manual
docker push <usuario>/cicd-kata:manual
```

**Check:** en Docker Hub aparece el repositorio y la etiqueta `manual`. No pongas un token en la línea de comandos ni lo compartas en proyector. Si no hay tiempo/cuenta, realiza este paso como demostración y sigue con la automatización en GitHub Actions.

Si los equipos configurarán Render en directo, crea ahora el servicio con esa imagen siguiendo los pasos 1–5 de «Configuración detallada de Render». Como la imagen inicial puede no tener `/health`, deja el health check sin configurar y añádelo tras completar ese endpoint en el bloque 80–95. Si cada alumno necesita su propio servicio, reserva tiempo o deja las cuentas/servicios preparados antes del taller.

### 75–80 min · Pausa y checkpoint

Antes de la pausa, cada equipo debe poder señalar: PR/check CI, imagen Docker local y, para quien lo haya hecho, etiqueta en Hub y servicio Render creado. Si no, usa `solved` para la demo de despliegue y conserva para el grupo el trabajo de CD y sus comprobaciones.

### 80–95 min · Añadir las señales operativas

En `main`, encarga a los equipos la secuencia siguiente (5 minutos de trabajo por endpoint; usar la documentación y tests del repo, sin pegar toda la solución de golpe):

1. Implementar `/health` con respuesta estable `{"status":"ok"}`.
2. Implementar `/version`, leyendo `APP_VERSION` y usando `dev` como valor local por defecto.
3. Asegurar que Docker incorpora `APP_VERSION` mediante build arg y variable de entorno.
4. Añadir/ajustar tests para ambos endpoints.

Validación local:

```powershell
npm run check
npm run build
npm run dev
curl.exe -i http://localhost:10000/health
curl.exe -i http://localhost:10000/version
```

**Esperado:** health 200 y JSON `status=ok`; version 200 y JSON con string `version` (`dev` localmente). No uses `/health` para fingir que todas las demás rutas funcionan; es una señal de disponibilidad, no un test funcional.

**Check para avanzar:** checks locales pasan y las rutas están cubiertas por tests. Si el ritmo va justo, comparte `solved` como referencia después de que cada equipo explique el contrato esperado.

Si el equipo ya creó el servicio desde la imagen anterior, vuelve a Render **Settings → Health Checks** y ahora añade `/health`. Confirma también que `PORT=10000` sigue configurado y que la app está healthy antes de continuar.

### 95–110 min · Diseñar el camino de CD y seguir el SHA

Pregunta: «CI ya nos dice que el cambio pasa las comprobaciones. ¿Qué falta para que llegue a Render y cómo sabremos qué commit está sirviendo?» Pide a los equipos localizar dónde Docker recibe `APP_VERSION` y dónde se consulta `/version`. Esta es la parte nueva que deben implementar/completar siguiendo los requisitos del ejercicio; compara después con la rama `solved`.

En la solución de referencia, el workflow de CD construye etiquetas inmutables `sha-<SHA-completo>` y `latest`. El SHA se incorpora como `APP_VERSION`; tras el Deploy Hook, Actions espera hasta cinco minutos a que `/version` coincida con el SHA esperado. `latest` sirve para comodidad, la etiqueta SHA para identificar exactamente el artefacto.

**Ejercicio de diseño/lectura:** antes de enseñar la solución, cada equipo dibuja los pasos que añadiría después de CI: construir imagen, publicarla, pedir a Render un deploy y comprobar la versión y el comportamiento. Después, en `.github/workflows/docker-publish.yml` de `solved`, encuentra (a) el trigger de push a `main`, (b) la dependencia de los checks de calidad ya existentes, (c) la etiqueta con SHA, (d) la petición al hook y (e) el check de versión. Cada equipo explica un bloque.

**Check:** pueden explicar la cadena `commit SHA → build arg APP_VERSION → imagen sha-SHA → /version`.

### 110–125 min · Observar el despliegue automatizado

Para el despliegue del instructor, usa un repositorio de demostración que ya tenga la solución completa y sus secretos configurados. En un repositorio de alumnos, el workflow de CD es el entregable de la kata: configúralo y publícalo solo cuando se hayan añadido los secrets y la variable `BASE_URL` en GitHub y exista el Deploy Hook del paso anterior. La CI de `main` permanece como está; CD debe reutilizar la misma garantía de calidad o depender de ella, no sustituirla.

1. Integra el cambio de la PR a `main` (o dispara la publicación desde la rama configurada para la demo).
2. En GitHub **Actions**, abre **Publish and deploy Docker image** y observa primero `Quality checks`.
3. Cuando pase, observa `Publish, deploy and verify`: login, build/push, petición a Render, espera de versión y smoke test.
4. En Render, localiza el deploy correspondiente; no vuelvas a pulsar deploy mientras el actual está en curso.
5. Desde terminal o navegador, valida:

```powershell
curl.exe -i https://<servicio>.onrender.com/health
curl.exe -i https://<servicio>.onrender.com/version
curl.exe -i https://<servicio>.onrender.com/dice/roll
```

**Check:** la ejecución de Actions está verde, `/version` devuelve el SHA esperado, `/health` devuelve status ok y el dado está en rango 1–6. La URL sola, un deploy verde o `latest` no prueban por sí solos que esté sirviendo el commit esperado.

**Si Render está dormido:** la primera solicitud puede tardar; haz una petición y espera hasta un minuto antes de concluir que está roto. Actions tiene su propia espera de hasta cinco minutos.

### 125–140 min · Simular incidente y recuperar

Hazlo únicamente en el servicio/repo de demostración, nunca en un servicio que use alumnado o clientes. Comprueba primero el SHA bueno en `/version` y apúntalo literalmente.

1. En Actions, abre **Publish and deploy Docker image → Run workflow**.
2. Selecciona `simulate_incident=true` y ejecuta.
3. Observa: la CI y la construcción pueden pasar; se publica una imagen separada `sha-<SHA>-incident`; el smoke test remoto detecta que el dado sale del rango y el workflow termina rojo.
4. No declares el ejercicio fallido todavía: pide al grupo que identifique qué check detectó el defecto y qué dato conserva la identidad de la versión buena.
5. Abre **Roll back Render image → Run workflow**, introduce el SHA completo bueno de 40 caracteres (sin `sha-`, sin `-incident`) y ejecútalo.
6. Espera a que el workflow confirme la versión restaurada y vuelve a consultar `/version`, `/health` y `/dice/roll`.

**Check final:** el endpoint version vuelve exactamente al SHA bueno, health es 200, el dado está en 1–6 y el workflow de rollback está verde. La imagen incident queda como evidencia, pero nunca reemplaza la etiqueta buena.

**Debrief:** «¿Qué habría pasado si solo tuviéramos `latest`? ¿Qué check detectó el problema? ¿Qué datos hacen que el rollback sea reproducible? ¿Qué cosas no arreglaría este rollback?» Respuesta clave: restaura imagen, no revierte cambios de base de datos ni configuración externa.

### 140–150 min · Cierre

Pide a cada equipo que enseñe en 30 segundos: URL, SHA bueno, check que prueba CI, check que prueba despliegue y cómo ejecutar rollback. Cierra con la diferencia entre:

- CI: valida el cambio antes de integrarlo.
- CD: publica/despliega un artefacto y comprueba el servicio real.
- Observabilidad mínima de esta kata: salud (`/health`), identidad (`/version`) y comportamiento (`/dice/roll`).

## Lista de checks para proyectar

| Etapa | Comando/evidencia | Criterio para avanzar |
| --- | --- | --- |
| Herramientas | `node --version`, `docker info` | Node 24+ y Docker accesible |
| Dependencias | `npm ci` | Instalación limpia |
| Calidad local | `npm run check` | lint, formato, typecheck y tests verdes |
| Build | `npm run build` | Compila sin error |
| App local | `/docs`, `/dice/roll` | HTTP 200; resultado 1–6 |
| Contenedor | `docker build` + `docker run` | El servicio responde desde el contenedor |
| CI remota | PR → **Quality checks** | Check verde en la PR |
| Señales | `/health`, `/version` | JSON estable y versión identificable |
| Publicación | Docker Hub | Tag SHA disponible |
| Despliegue | Render + Actions | `/version` coincide con SHA esperado |
| Smoke test | `/dice/roll` remoto | Entero entre 1 y 6 |
| Recuperación | workflow rollback | SHA bueno restaurado y tres endpoints OK |

## Si algo falla

| Síntoma | Diagnóstico rápido | Acción durante la sesión |
| --- | --- | --- |
| `npm ci` falla | versión de Node, red, lockfile | Confirma Node 24 y acceso al registro; usa la demo mientras el equipo resuelve la red. |
| `npm run check` falla | el primer script rojo identifica la categoría | Corregir lint/formato/tipos/tests; no saltar a Docker aún. |
| Docker daemon no disponible | Docker Desktop parado o sin recursos | Iniciar Docker Desktop; si no hay tiempo, el equipo puede avanzar en endpoints y diseño de CD mientras el instructor demuestra el contenedor. |
| Docker build falla | revisar etapa y salida inicial del error | Corregir antes de hacer push; usar `docker build --no-cache` solo si hay indicios de caché obsoleta. |
| Push a Hub denegado | usuario, repo, token/permisos | Login con usuario correcto y access token; nunca pedir que lo peguen en el canal. |
| Render dice `port scan`/no detecta puerto | escuchar en `0.0.0.0`, `PORT=10000`, puerto expuesto | Confirma `PORT=10000`, listener en `0.0.0.0` y Dockerfile/servicio en puerto 10000. |
| Render health check 404 | imagen inicial no tiene `/health` o está desplegada la imagen vieja | En esta kata, publica primero la solución de endpoint; espera el deploy correcto antes de fijar `/health` como path. |
| `/version` devuelve SHA anterior | Render sigue arrancando la versión previa o hook apunta a `latest` | Comprueba el deploy y que el hook recibe `imgURL=docker.io/...:sha-<SHA>`. No repitas sin mirar el estado de Render. |
| Actions manual no muestra workflow | workflow no está en default branch | Usa la rama predeterminada preparada para demo o integra el workflow ahí en el fork de aula. |
| Actions tarda esperando servicio | Render duerme, hook o URL mal configurados | Revisa `BASE_URL` sin `/` final, el deploy más reciente y logs; dale tiempo al arranque en frío. |
| Smoke test falla en incidente | comportamiento intencional del ejercicio | Verifica que se haya publicado `-incident`; recupera usando el SHA bueno, no edites el workflow para hacerlo verde. |
| URL tarda o no responde | instancia gratuita suspendida / despliegue en curso | Haz una petición, espera hasta un minuto y revisa Events/Logs en Render. |

## Recorrido corto de 120 minutos

Si la sesión pierde tiempo, lleva Docker Hub y Render preconfigurados y reduce la publicación manual a una demostración de 5 minutos. Haz una comprobación breve de la CI que ya viene en `main`; no implementes CI en directo. Mantén el bloque de endpoints, el despliegue con comprobación de SHA y el incidente con rollback; son el núcleo pedagógico. Usa `solved` para comparar en vez de dictar todo el YAML.

## Referencias del repositorio

- [Guion de diapositivas](GUION-WORKSHOP-CD.md)
- [README de la solución](node-cicd-kata/README.md)
- Workflows de referencia: `node-cicd-kata/.github/workflows/code-quality.yml`, `docker-publish.yml` y `rollback.yml`.
