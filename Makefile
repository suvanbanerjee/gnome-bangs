EXTENSION_UUID = bangs-search@suvan
EXTENSION_DIR = ~/.local/share/gnome-shell/extensions/$(EXTENSION_UUID)

.PHONY: all install uninstall compile-schemas clean

all: compile-schemas install

install: compile-schemas
	@echo "Installing extension..."
	mkdir -p $(EXTENSION_DIR)
	cp extension.js $(EXTENSION_DIR)/
	cp prefs.js $(EXTENSION_DIR)/
	cp bangs.json $(EXTENSION_DIR)/
	cp metadata.json $(EXTENSION_DIR)/
	cp bang.png $(EXTENSION_DIR)/
	mkdir -p $(EXTENSION_DIR)/schemas
	cp schemas/*.xml $(EXTENSION_DIR)/schemas/
	glib-compile-schemas $(EXTENSION_DIR)/schemas
	@echo "Extension installed at $(EXTENSION_DIR)."
	@echo "Restart GNOME Shell or reload extensions to apply changes."

uninstall:
	@echo "Uninstalling extension..."
	rm -rf $(EXTENSION_DIR)
	@echo "Extension uninstalled."
	@echo "Restart GNOME Shell or reload extensions to apply changes."

compile-schemas:
	@echo "Compiling GSettings schemas..."
	glib-compile-schemas schemas/

clean:
	@echo "Cleaning up compiled schemas..."
	rm -f schemas/gschemas.compiled
	@echo "Done."