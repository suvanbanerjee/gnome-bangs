import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class BangsSearchPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
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

        const file = Gio.File.new_for_path(`${this.path}/bangs.json`);
        file.replace_contents(JSON.stringify(validatedBangs, null, 2), null, false, Gio.FileCreateFlags.NONE, null);
        console.log(_('Custom bangs saved.'));
    }

    _validateAndSave(bangs) {
        this._saveBangsToFile(bangs);
    }

    _loadBangsFromFile() {
        const file = Gio.File.new_for_path(`${this.path}/bangs.json`);
        if (file.query_exists(null)) {
            const [, contents] = file.load_contents(null);
            return JSON.parse(new TextDecoder().decode(contents));
        } else {
            file.create(Gio.FileCreateFlags.NONE, null);
            return [];
        }
    }
}