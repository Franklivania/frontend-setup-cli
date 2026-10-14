# Privacy model

Frontend Setup is designed to work locally and does not include analytics or telemetry.

## Local inspection

`setup init` reads only project metadata needed to make safe setup decisions, such as `package.json`, lockfile names, and the presence of framework configuration files. It does not recursively read application source files to classify the project. It does not upload source files, local configuration, package metadata, environment variables, or generated output.

## Network activity

The CLI can make a read-only request to a user-configured catalog URL when `setup sync` is explicitly run, and a read-only request to the npm registry when `setup update` is explicitly run. These requests download package/version metadata or a JSON catalog; no project file or project metadata is sent to either service. Standard network metadata (such as IP address and user-agent) is handled by the network provider as usual.

The CLI never executes code downloaded from a catalog. Catalog content is treated as data and is schema-checked before it is cached.

## Filesystem behavior

The CLI writes files only under the selected project directory. Existing files are preserved by default. `--force` allows replacement only after creating a backup. No global configuration is written unless a future feature explicitly offers it and the user opts in.

## Dependencies and installation

The package manager used to invoke the CLI may contact its configured package registry to download the CLI and its declared dependencies. That behavior is controlled by the package manager, not by this project.
