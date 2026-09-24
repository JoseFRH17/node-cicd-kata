# Node CI/CD Kata

Versión en Node.js y TypeScript de la práctica
[Python CI/CD Kata](https://github.com/aran159/python-cicd-kata). El servicio simula la
tirada de un dado y sirve como base para practicar integración y despliegue continuos con
GitHub Actions y Docker Hub. 

## Prerrequisitos

- [Node.js 24 o superior](https://nodejs.org/es/download). La versión recomendada está
  indicada en `.nvmrc`.
- npm, incluido con Node.js.
- Docker, únicamente si se quiere construir y ejecutar la imagen localmente.
- Git, para trabajar con el repositorio.
- Una cuenta de Docker Hub, únicamente para completar el ejercicio de publicación.

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

## Docker

Cuando `npm run check` finalice correctamente, construir y ejecutar la imagen:

```bash
docker build -t <usuario>/<servicio>:latest .
docker run --rm -p 10000:10000 <usuario>/<servicio>:latest
```

Comprobar el servicio:

```bash
curl http://localhost:10000/dice/roll
```

## Ejercicio

1. Corrige los problemas de calidad intencionados y consigue que `npm run check` finalice
   correctamente.
2. Configura un hook `pre-commit` con Husky que ejecute las comprobaciones de calidad.
3. Crea un workflow de GitHub Actions que ejecute lint, formato, tipos, tests y build en cada
   pull request a `main`.
4. Protege `main` para exigir el check del workflow antes de integrar cambios.
5. Crea un workflow que construya la imagen Docker y la publique en Docker Hub tras cada push a
   `main`.
6. Configura en GitHub Actions los secretos necesarios para publicar la imagen sin exponer las
   credenciales en el repositorio.

## Desarrollo del ejercicio

La función de dominio está aislada en `src/application/get-dice-roll.ts`, por lo que se puede
ampliar sin acoplarla a HTTP. Una continuación natural de la kata consiste en aceptar el
número de caras o el número de dados, añadir los tests primero y completar el cambio mediante
un pull request.
