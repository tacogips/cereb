
dev:
	bun src/main.ts

update-nix:
	node2nix

build:
	mkdir -p dist
	bun build src/main.ts --compile --outfile dist/cereb

debug:
	bun --inspect src/main.ts
