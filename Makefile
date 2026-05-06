.PHONY: build test frontend clean install help

BINARY := galaxy
GOFILES := $(shell find . -name '*.go' -not -path './frontend/*')

help:
	@echo "Galaxy - Self-skeptical AI agent for SIFT forensics"
	@echo ""
	@echo "Targets:"
	@echo "  build      Build the galaxy CLI binary"
	@echo "  test       Run Go unit tests"
	@echo "  frontend   Build the Next.js dashboard"
	@echo "  install    Install the binary to /usr/local/bin"
	@echo "  clean      Remove build artifacts"

build:
	go build -o $(BINARY) .

test:
	go test ./...

frontend:
	cd frontend && npm install && npm run build

install: build
	sudo install -m 0755 $(BINARY) /usr/local/bin/$(BINARY)

clean:
	rm -f $(BINARY)
	rm -rf frontend/.next frontend/node_modules
