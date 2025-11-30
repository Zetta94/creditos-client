# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Guía rápida para trabajar en tu IDE

1. Abre la carpeta del proyecto en tu IDE apuntando a `/workspace/creditos-client/creditos-client`. Ahí están `package.json`, `src/` y `public/`.
2. Si usas VS Code con **Dev Containers**, conecta la ventana al contenedor en ejecución y abre esa misma carpeta. Así aprovecharás la versión de Node y las dependencias ya instaladas en el contenedor.
3. Si prefieres **Remote SSH**, conecta vía SSH al entorno y abre la carpeta del proyecto desde allí.
4. Ejecuta `npm install` una vez para asegurar dependencias y usa `npm run dev` para levantar Vite en modo desarrollo. El IDE puede tomar la configuración de TypeScript/ESLint incluida para autocompletado y linting.
