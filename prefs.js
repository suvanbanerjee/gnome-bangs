import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class BangsSearchPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
        
        // Default Search Engine section
        const defaultGroup = new Adw.PreferencesGroup({
            title: _('Default Search Engine'),
            description: _('Set the default search engine to use when no bang is specified.'),
        });

        // Enable/Disable toggle
        const enableSwitch = new Gtk.Switch({
            active: settings.get_boolean('enable-default-search'),
            valign: Gtk.Align.CENTER,
        });

        enableSwitch.connect('notify::active', () => {
            settings.set_boolean('enable-default-search', enableSwitch.active);
            defaultSearchEntry.sensitive = enableSwitch.active;
            presetBox.sensitive = enableSwitch.active;
        });

        const enableRow = new Adw.ActionRow({
            title: _('Enable Default Search'),
            subtitle: _('Show search results when no bang is specified'),
        });
        enableRow.add_suffix(enableSwitch);
        defaultGroup.add(enableRow);

        const defaultSearchEntry = new Gtk.Entry({
            placeholder_text: _('https://duckduckgo.com/?q={query}'),
            hexpand: true,
            text: settings.get_string('default-search-engine'),
            sensitive: settings.get_boolean('enable-default-search'),
        });

        defaultSearchEntry.connect('changed', () => {
            const url = defaultSearchEntry.text;
            if (url.includes('{query}') && url.startsWith('http')) {
                settings.set_string('default-search-engine', url);
            }
        });

        const defaultRow = new Adw.ActionRow({
            title: _('Default Search Engine URL'),
            subtitle: _('URL must contain "{query}" placeholder'),
        });
        defaultRow.add_suffix(defaultSearchEntry);
        defaultGroup.add(defaultRow);

        // Quick preset buttons
        const presetEngines = [
            { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}' },
            { name: 'Google', url: 'https://www.google.com/search?q={query}' },
            { name: 'Bing', url: 'https://www.bing.com/search?q={query}' },
            { name: 'Startpage', url: 'https://www.startpage.com/sp/search?query={query}' },
        ];

        const presetBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            margin_top: 10,
            halign: Gtk.Align.CENTER,
            sensitive: settings.get_boolean('enable-default-search'),
        });

        presetEngines.forEach(engine => {
            const button = new Gtk.Button({ label: engine.name });
            button.connect('clicked', () => {
                defaultSearchEntry.text = engine.url;
                settings.set_string('default-search-engine', engine.url);
            });
            presetBox.append(button);
        });

        const presetRow = new Adw.ActionRow({
            title: _('Quick Presets'),
        });
        presetRow.add_suffix(presetBox);
        defaultGroup.add(presetRow);

        // Custom Bangs section
        const group = new Adw.PreferencesGroup({
            title: _('Custom Bangs'),
            description: _('Add or modify custom bangs. Ensure URLs include "{query}".'),
        });
        let bangs = this._loadBangsFromFile();
        const addBangRow = (bang, index) => {
            const keyEntry = new Gtk.Entry({
                placeholder_text: _('Bang Key (e.g., g)'),
                hexpand: true,
            });

            const urlEntry = new Gtk.Entry({
                placeholder_text: _('URL (e.g., https://google.com/search?q={query})'),
                hexpand: true,
            });

            keyEntry.text = bang?.key || '';
            urlEntry.text = bang?.url || '';

            keyEntry.connect('changed', () => this._onBangChanged(bangs, index, keyEntry, urlEntry));
            urlEntry.connect('changed', () => this._onBangChanged(bangs, index, keyEntry, urlEntry));

            const deleteButton = new Gtk.Button({ label: _('Delete') });
            deleteButton.connect('clicked', () => {
                bangs.splice(index, 1);
                this._saveBangsToFile(bangs);
                group.remove(row);
            });

            const row = new Adw.ActionRow();
            row.add_prefix(keyEntry);
            row.add_suffix(urlEntry);
            row.add_suffix(deleteButton);

            group.add(row);
        };

        bangs.forEach((bang, index) => addBangRow(bang, index));
        const addButton = new Gtk.Button({ label: _('Add Bang') });
        addButton.connect('clicked', () => {
            const newBang = { key: '', url: '' };
            bangs.push(newBang);
            addBangRow(newBang, bangs.length - 1);
        });

        const addBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            margin_top: 20,
            margin_bottom: 20,
            halign: Gtk.Align.CENTER,
        });
        addBox.append(addButton);
        const addGroup = new Adw.PreferencesGroup();
        addGroup.add(addBox);
        const restartLabel = new Gtk.Label({
            label: _('To apply changes, restart GNOME Shell.'),
            halign: Gtk.Align.CENTER,
            margin_top: 10,
        });
        addGroup.add(restartLabel);
        page.add(defaultGroup);
        page.add(group);
        page.add(addGroup);
        window.add(page);
    }

    _onBangChanged(bangs, index, keyEntry, urlEntry) {
        bangs[index] = {
            key: keyEntry.text,
            url: urlEntry.text,
        };

        this._validateAndSave(bangs);
    }

    _saveBangsToFile(bangs) {
        const validatedBangs = bangs.filter(
            (bang) =>
                bang.key &&
                bang.url.includes('{query}') &&
                bang.url.startsWith('http')
        );

        const file = Gio.File.new_for_path(`${GLib.get_user_config_dir()}/bangs.json`);
        file.replace_contents(JSON.stringify(validatedBangs, null, 2), null, false, Gio.FileCreateFlags.NONE, null);
        console.log(_('Custom bangs saved.'));
    }

    _validateAndSave(bangs) {
        this._saveBangsToFile(bangs);
    }

    _loadBangsFromFile() {
        const file = Gio.File.new_for_path(`${GLib.get_user_config_dir()}/bangs.json`);
        if (file.query_exists(null)) {
            const [, contents] = file.load_contents(null);
            return JSON.parse(new TextDecoder().decode(contents));
        } else {
            file.create(Gio.FileCreateFlags.NONE, null);
            return [];
        }
    }
}