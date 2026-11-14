{
  description = "yet another ai chat client";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        nodeEnv = pkgs.callPackage ./node-env.nix { };
        nodePackages =
          if builtins.pathExists ./node-packages.nix then
            import ./node-packages.nix {
              inherit (pkgs)
                stdenv
                lib
                fetchurl
                fetchgit
                nix-gitignore
                ;
              inherit nodeEnv;
            }
          else
            { };

        getNpmPackage =
          attr:
          if builtins.hasAttr attr nodePackages then nodePackages.${attr} else pkgs.nodePackages.${attr};

      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            (getNpmPackage "typescript-language-server")
            just
            node2nix
          ];
          shellHook = ''
            echo "Welcome to the development environment!"
            echo "To generate node-packages.nix, run:"
            echo "node2nix -i node-packages.json"
          '';
        };
        packages.cereb = pkgs.stdenv.mkDerivation {
          name = "cereb";
          src = ./.;
          nativeBuildInputs = with pkgs; [
            bun
          ];

          buildPhase = ''
            runHook preBuild
            set -x

            if [[ -e ${nodePackages.shell.nodeDependencies or ""}/lib/node_modules ]]; then
            	echo "Setting up node_modules from node2nix..."
            	ln -sf ${nodePackages.shell.nodeDependencies}/lib/node_modules ./node_modules
            	export PATH="${nodePackages.shell.nodeDependencies}/bin:$PATH"
            else
            	echo "node-packages.nix not found or invalid. Using system-wide pnpm..."
            	# Fallback to regular pnpm install
            	export HOME=$TMPDIR
            	bun install --force
            fi

            echo "Building project..."
            bun build --compile src/main.ts --outfile cereb

            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            set -x

            mkdir -p $out/
            cp cereb $out/
            chmod +x $out/cereb

            mkdir -p $out/bin
            ln -s $out/cereb $out/bin/cereb

            runHook postInstall
          '';
        };
        apps.default = flake-utils.lib.mkApp {
          drv = self.packages.${system}.cereb;
        };
      }
    );
}
