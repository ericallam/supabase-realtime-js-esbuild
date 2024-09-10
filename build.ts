import * as esbuild from "esbuild";
import nodeResolve from "resolve";

async function doBuild() {
  const format = (process.env.FORMAT ?? "esm") as esbuild.Format;

  const results = await esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    minify: false,
    sourcemap: true,
    target: ["node20", "es2022"],
    outdir: "dist",
    splitting: format === "esm",
    charset: "utf8",
    platform: "node",
    format: format,
    tsconfig: format === "esm" ? "tsconfig.json" : "tsconfig.cjs.json",
    external: process.env.EXTERNALIZE ? ["@supabase/realtime-js"] : [],
    outExtension: { ".js": format === "esm" ? ".mjs" : ".cjs" },
    plugins: [
      {
        name: "supabase",
        setup(build) {
          if (format === "esm") {
            build.onResolve({ filter: /^@supabase\/realtime-js$/ }, (args) => {
              const resolvedPath = nodeResolve.sync(args.path, {
                basedir: args.resolveDir,
              });

              let $path = resolvedPath;

              if (process.env.FIX) {
                console.log(
                  "Applying fix to @supabase/realtime-js path resolution",
                  {
                    original: resolvedPath,
                    resolvedPath: resolvedPath.replace(
                      "dist/main",
                      "dist/module"
                    ),
                  }
                );

                $path = resolvedPath.replace("dist/main", "dist/module");
              } else {
                console.log(
                  "Skipping fix for `@supabase/realtime-js` path resolution",
                  {
                    resolvedPath,
                  }
                );
              }

              return {
                path: $path,
                external: process.env.EXTERNALIZE === "1",
              };
            });
          } else {
            console.log(
              "Skipping fix for `@supabase/realtime-js` path resolution because we are outputting cjs"
            );
          }
        },
      },
    ],
  });

  if (results.errors.length > 0) {
    process.exit(1);
  }

  console.log(`${format} build complete`);
}

await doBuild();
