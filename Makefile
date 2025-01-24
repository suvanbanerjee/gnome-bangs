EXTENSION_DIR = ~/.local/share/gnome-shell/extensions/bangs-search@suvan

.PHONY: all install uninstall

all: install

install:
	@echo "Installing extension..."
	mkdir -p $(EXTENSION_DIR)
	cp -r * $(EXTENSION_DIR)
	@echo "Extension installed. Restart GNOME Shell and enable the extension."

uninstall:
	@echo "Uninstalling extension..."
	rm -rf $(EXTENSION_DIR)
	@echo "Extension uninstalled. Restart GNOME Shell to apply changes."
