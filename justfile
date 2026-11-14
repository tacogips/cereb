
dev:
	bun src/main.ts

#TODO(tacogips) run on pre-commit
update-nix:
	node2nix

build:
	mkdir -p dist
	bun build src/main.ts --compile --outfile dist/cereb

nix-build:
	nix build ".#cereb"

debug:
	bun --inspect src/main.ts
