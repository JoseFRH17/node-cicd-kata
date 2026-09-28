# Node CI/CD Kata

Versión en Node.js y TypeScript de la práctica
[Python CI/CD Kata](https://github.com/aran159/python-cicd-kata). El servicio simula la
tirada de un dado y sirve como base para practicar integración y despliegue continuos con
GitHub Actions y Docker Hub.

## Prerrequisitos

- [Node.js 24 o superior](https://nodejs.org/es/download). La versión recomendada está
  indicada en `.nvmrc`.
- npm, incluido con Node.js.
- Docker, únicamente para la segunda sesión o si se quiere probar la imagen localmente.
- Git, para trabajar con el repositorio.
- Una cuenta de Docker Hub, únicamente para la segunda sesión de publicación.

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
- `husky`: creación de hooks de Git.

## TypeScript: tipos sobre JavaScript

TypeScript permite indicar qué tipos de datos reciben y devuelven las funciones. Estos tipos se
comprueban durante el desarrollo y se eliminan al compilar a JavaScript.

JavaScript:

```js
function add(a, b) {
  return a + b;
}

add(2, '3'); // Puede producir "23" sin avisar antes de ejecutarse.
```

TypeScript:

```ts
function add(a: number, b: number): number {
  return a + b;
}

add(2, 3); // Correcto.
add(2, '3'); // Error de TypeScript antes de ejecutar el programa.
```

En este proyecto, la función `getDiceRoll` también declara sus tipos:

```ts
export function getDiceRoll(random: () => number = Math.random): number {
  return Math.floor(random() * 6) + 1;
}
```

El parámetro `random` debe ser una función que no reciba argumentos y devuelva un número, y la
función `getDiceRoll` siempre devuelve un número.

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

El repositorio incluye el comando `npm run check`, que reúne las comprobaciones de lint, formato,
tipos y tests.

## Ejercicio

### Sesión 1: integración continua (CI)

Trabajad en equipos de al menos dos personas. Una persona hace un fork del repositorio y añade
al resto como colaboradores. Cada integrante crea una rama `features/dice-plus-<i>`, con un valor
asignado de `i` entre 1 y 5. En esa rama, el dado debe devolver su tirada habitual (`X`, entre
1 y 6) más `i`.

1. Implementa el cambio en tu rama y actualiza los tests para cubrir el nuevo comportamiento,
   tanto en la función como en la API. Ejecuta `npm run check` antes de abrir la pull request.
2. Configura un hook `pre-commit` con Husky que ejecute `npm run check`. La instalación de
   dependencias ejecuta el script `prepare` de `package.json` para activar Husky, pero **no crea
   el hook**: hay que crear y versionar el fichero `.husky/pre-commit` con este contenido:

   ```sh
   npm run check
   ```

   Cada integrante debe ejecutar `npm install` en su clon para activar los hooks locales. Los
   hooks no sustituyen a los checks de CI: pueden faltar o evitarse en una máquina.

3. Abre una pull request a `main` y revisa el check `Quality checks`. El workflow de CI ya está
   preparado en `.github/workflows/code-quality.yml` y ejecuta lint, formato, tipos, tests y build.
4. Protege `main` para exigir el check `Quality checks` antes de integrar cambios.

### Sesión 2: despliegue continuo (CD)

1. Construye la imagen localmente, ejecútala y comprueba `/dice/roll` en el puerto `10000`.
2. Publícala en Docker Hub con una etiqueta identificable y crea en Render un servicio desde esa
   imagen. Comprueba `/docs` y `/dice/roll` en la URL pública.
3. Completa un workflow de CD que, al integrar cambios en `main`, valide el código, construya la
   imagen, la publique y solicite el despliegue en Render.
4. Guarda el token de Docker Hub y la URL del deploy hook de Render como secrets de GitHub Actions.
5. Añade las rutas `/version` y `/health`; incorpora el SHA del commit a la imagen y verifica la
   versión y la respuesta de `/dice/roll` después del despliegue.
6. Despliega un fallo preparado, detecta el contrato roto con un smoke test y vuelve a desplegar la
   imagen buena. Después corrige el código y añade un test para evitar la regresión.

Para probar la imagen localmente, una vez que `npm run check` finalice correctamente:

```bash
docker build -t <usuario>/<servicio>:latest .
docker run --rm -p 10000:10000 <usuario>/<servicio>:latest
```

Comprobar el servicio:

```bash
curl http://localhost:10000/dice/roll
```

## Desarrollo del ejercicio

Como extensión opcional, puedes ampliar la función de dominio aislada en
`src/application/get-dice-roll.ts` para aceptar el número de caras o de dados sin acoplarla a
HTTP. Cubre cualquier cambio adicional con tests y complétalo mediante un pull request.
